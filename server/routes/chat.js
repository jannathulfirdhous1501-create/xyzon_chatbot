const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const {
  detectLanguage,
  generateReply,
  textToSpeech
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

    // 2. Build history for LLM context (last 6 messages)
    const historyForLLM = conv.messages.slice(-6).map(m => ({
      role: m.role === 'bot' || m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text
    }));

    // 3. Generate AI reply
    let rawReply = await generateReply(message, historyForLLM);

    // 4. Clean the reply
    let aiReply = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, '');
    aiReply = aiReply.replace(/<think>[\s\S]*/gi, '');
    aiReply = aiReply.trim();

    // Fallback if cleaning left empty string
    if (!aiReply) {
      aiReply = "I'm here to help with Xyzon Innovations questions. What would you like to know?";
    }

    // 5. Detect languages
    const userLangCode = await detectLanguage(message);
    const botLangCode  = await detectLanguage(aiReply);

    // 6. Generate TTS audio — fully isolated, never crashes the response
    let audioBase64 = null;
    if (includeAudio && aiReply) {
      try {
        // If bot replied in English, use Hindi voice (Sarvam works better)
        const ttsLang = (botLangCode === 'en-IN' || botLangCode === 'en-US')
          ? 'hi-IN'
          : botLangCode;

        console.log(`🔊 TTS: lang=${ttsLang}, text length=${aiReply.length}`);
        audioBase64 = await textToSpeech(aiReply, ttsLang);

        if (audioBase64) {
          console.log('✅ TTS audio generated successfully');
        } else {
          console.warn('⚠️ TTS returned null — sending text-only response');
        }
      } catch (voiceErr) {
        // TTS failure is non-fatal — user still gets text reply
        const errCode = voiceErr.code || voiceErr.message || 'unknown';
        if (errCode.includes('ABORTED') || errCode.includes('ECONNRESET') || errCode.includes('stream')) {
          console.warn('⚠️ TTS stream aborted (Sarvam rate limit or timeout) — skipping audio');
        } else {
          console.error('❌ TTS Generation Failed:', voiceErr.message);
        }
        audioBase64 = null;
      }
    }

    // 7. Save exchange to MongoDB
    conv.messages.push(
      {
        role: 'user',
        text: message,
        detectedLang: userLangCode
      },
      {
        role: 'bot',
        text: aiReply,
        detectedLang: botLangCode
      }
    );
    await conv.save();

    // 8. Send response — always succeeds even if audio is null
    return res.json({
      text: aiReply,
      detectedLang: botLangCode,
      audio: audioBase64   // null = text-only, frontend handles gracefully
    });

  } catch (err) {
    console.error('❌ Chat Route Error:', err);
    return res.status(500).json({ error: 'AI Service Error', details: err.message });
  }
});

module.exports = router;