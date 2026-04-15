const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const {
  generateReply,
  textToSpeech,
  detectScript,
  scriptToLangCode
} = require('../services/sarvam');

router.post('/', async (req, res) => {
  const { sessionId, message, includeAudio = true } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message required' });
  }

  try {
    // 1. Find or create conversation
    let conv = await Conversation.findOne({ sessionId });
    if (!conv) {
      conv = new Conversation({ sessionId, messages: [] });
    }

    // 2. Build history for LLM (last 6 messages)
    const historyForLLM = conv.messages.slice(-6).map(m => ({
      role: m.role === 'bot' || m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text
    }));

    // 3. Detect user's language from INPUT using script detection (reliable)
    const cleanMessage = message.replace(/^\[SYSTEM:[\s\S]*?\]\s*/i, '').trim();
    const userScript = detectScript(cleanMessage);
    const userLangCode = scriptToLangCode(userScript, cleanMessage);
    console.log(`👤 User lang: script=${userScript} → ${userLangCode}`);

    // 4. Generate AI reply
    let rawReply = await generateReply(message, historyForLLM);

    // 5. Clean the reply
    let aiReply = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, '');
    aiReply = aiReply.replace(/<think>[\s\S]*/gi, '');
    aiReply = aiReply.trim();

    if (!aiReply) {
      aiReply = "I specialize in Xyzon Innovations' tech-education programs. Let me know if you need details about our courses, internships, or placements!";
    }

    // 6. ✅ FIXED: Use userLangCode for badge — bot reply has no trigger words
    console.log(`🤖 Bot lang: using user lang → ${userLangCode}`);

    // 7. TTS — ✅ FIXED: use userLangCode so TTS speaks in correct language
    let audioBase64 = null;
    if (includeAudio && aiReply) {
      try {
        console.log(`🔊 TTS: lang=${userLangCode}, text length=${aiReply.length}`);
        audioBase64 = await textToSpeech(aiReply, userLangCode);
        if (audioBase64) {
          console.log('✅ TTS audio generated successfully');
        } else {
          console.warn('⚠️ TTS returned null — text-only response');
        }
      } catch (voiceErr) {
        const errCode = voiceErr.code || voiceErr.message || '';
        if (errCode.includes('ABORTED') || errCode.includes('ECONNRESET') || errCode.includes('stream')) {
          console.warn('⚠️ TTS stream aborted — skipping audio');
        } else {
          console.error('❌ TTS Generation Failed:', voiceErr.message);
        }
        audioBase64 = null;
      }
    }

    // 8. Save to MongoDB
    conv.messages.push(
      { role: 'user', text: cleanMessage, detectedLang: userLangCode },
      { role: 'bot',  text: aiReply,      detectedLang: userLangCode }
    );
    await conv.save();

    // 9. ✅ FIXED: Send userLangCode so frontend badge shows correct language
    return res.json({
      text: aiReply,
      detectedLang: userLangCode,
      audio: audioBase64
    });

  } catch (err) {
    console.error('❌ Chat Route Error:', err);
    return res.status(500).json({ error: 'AI Service Error', details: err.message });
  }
});

module.exports = router;