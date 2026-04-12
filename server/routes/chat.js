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

    let conv = await Conversation.findOne({ sessionId });

    if (!conv) {

      conv = new Conversation({ sessionId, messages: [] });

    }



    const historyForLLM = conv.messages.slice(-6).map(m => ({

      role: m.role === 'bot' || m.role === 'assistant' ? 'assistant' : 'user',

      content: m.text

    }));



    // 3. Generate the AI reply

    let rawReply = await generateReply(message, historyForLLM);



    // 4. CLEAN & VALIDATE (Critical Fix for the 500 Error)

    let aiReply = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, '');

    aiReply = aiReply.replace(/<think>[\s\S]*/gi, '');

    aiReply = aiReply.trim();



    // BUG FIX: If cleaning left us with an empty string, set a fallback

    // This prevents "Path `text` is required" error in MongoDB

    if (!aiReply) {

      aiReply = "I understand. How else can I help you?";

    }



    // 5. Detection Logic

    const userLangCode = await detectLanguage(message);

    const botLangCode = await detectLanguage(aiReply);



    // 6. Generate Voice (TTS)

    let audioBase64 = null;

    if (includeAudio && aiReply) {

      try {

        // Voice follows the BOT'S language

        const ttsLang = (botLangCode === 'en-IN' || botLangCode === 'en-US') ? 'hi-IN' : botLangCode;

        audioBase64 = await textToSpeech(aiReply, ttsLang);

      } catch (voiceErr) {

        console.error('❌ TTS Generation Failed:', voiceErr.message);

      }

    }



    // 7. Save the exchange to MongoDB

    conv.messages.push(

      {

        role: 'user',

        text: message,

        detectedLang: userLangCode

      },

      {

        role: 'bot',

        text: aiReply, // This is now guaranteed to have text

        detectedLang: botLangCode

      }

    );

    await conv.save();



    // 8. Return response

    res.json({

      text: aiReply,

      detectedLang: botLangCode,

      audio: audioBase64

    });



  } catch (err) {

    // Log the full error to see exactly what happened

    console.error('❌ Chat Route Error:', err);

    res.status(500).json({ error: 'AI Service Error', details: err.message });

  }

});



module.exports = router;