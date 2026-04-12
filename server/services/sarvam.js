const axios = require('axios');

const FormData = require('form-data');



const BASE = "https://api.sarvam.ai";

// EMERGENCY: Hardcode your key here for the demo if process.env fails

const KEY = process.env.SARVAM_API_KEY || "sk_i5in7cwi_5XzAynJDt0dsukCCOK0AIjYq";



const headers = {

  'api-subscription-key': KEY,

  'Content-Type': 'application/json'

};



// 1. Detect Language

const detectLanguage = async (text) => {

  try {

    const res = await axios.post(`${BASE}/text-to-text/language-identification/v1`, {

      input: text

    }, { headers, timeout: 5000 });

    return res.data.language_code || 'en-IN';

  } catch (error) {

    return 'en-IN';

  }

};



// 2. Generate Reply

const generateReply = async (userText, history = []) => {

  try {

    // 1. IMPROVED DETECTION (Added Malayalam and refined logic)

    const isMalayalam = /[\u0D00-\u0D7F]/.test(userText);

    const isTamil = /[\u0B80-\u0BFF]/.test(userText);

    const isRomanized = /^[A-Za-z0-9\s!@#$%^&*(),.?":{}|<>]+$/.test(userText);



    let scriptRule = "";

    if (isMalayalam) {

      scriptRule = "User is using MALAYALAM SCRIPT. Reply ONLY in MALAYALAM script. No English.";

    } else if (isTamil) {

      scriptRule = "User is using TAMIL SCRIPT. Reply ONLY in TAMIL script. No English.";

    } else if (isRomanized) {

      scriptRule = "User is using Roman letters. Reply in TANGLISH, HINGLISH, or MANGLISH slang using English letters only.";

    }



    const systemPrompt = {
  role: 'system',
  content: `You are PolyBot, a smart, friendly, and ultra-accurate multilingual assistant. 
  
  CURRENT TASK GUIDELINES:
  1. EXACT SCRIPT MATCH: If the user speaks in Tamil script, reply ONLY in Tamil script. If Malayalam, reply ONLY in Malayalam script. 
  2. ROMANIZED SLANG (Tanglish/Hinglish): 
     - If the user uses English letters to speak Tamil (Tanglish), reply in English letters using ONLY Tamil and English words. DO NOT add Hindi words.
     - If the user uses English letters to speak Hindi (Hinglish), reply in English letters using ONLY Hindi and English words.
  3. VOICE DEMO OPTIMIZATION: Keep every response between 2 to 4 sentences maximum. Do not provide long lists or essays. This ensures the Text-to-Speech engine does not cut off.
  4. ACCURACY: Answer the user's question directly and correctly first, then add your friendly personality.
  5. FORBIDDEN PHRASES: Never say "I understand. How else can I help you?". Always be specific to the user's input.
  6. CLEAN OUTPUT: Do not use Markdown symbols like ** or #. Use plain text only so the voice reader sounds natural.`

};



    const messages = [

      systemPrompt,

      { role: 'user', content: userText }

    ];



    const res = await axios.post(`${BASE}/v1/chat/completions`, {

      model: 'sarvam-m',

      messages: messages,

      temperature: 0.9 // Bumping to 0.9 helps the AI "choose" the right language over English

    }, { headers, timeout: 15000 });



    let aiReply = res.data.choices[0].message.content;

    return aiReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();



  } catch (error) {

    console.error("❌ DEBUG LLM ERROR:", error.response?.data || error.message);

    return "Sorry bro, server busy. Can we talk again?";

  }

};



// 3. Speech to Text

const speechToText = async (audioBuffer) => {

  const form = new FormData();

  form.append('file', audioBuffer, { filename: 'audio.wav', contentType: 'audio/wav' });

  form.append('model', 'saaras:v3');

  form.append('language_code', 'unknown');



  try {

    const res = await axios.post(`${BASE}/speech-to-text`, form, {

      headers: { ...form.getHeaders(), 'api-subscription-key': KEY },

      timeout: 60000

    });



    // Inside speechToText after res.data

// Inside speechToText function, before 'return'

// Inside speechToText function, after getting res.data

// Inside speechToText after res.data is received

let transcript = res.data.transcript || "";

let lang = res.data.language_code || 'en-IN';



// 🚨 NORMALIZATION LAYER 🚨

// This regex catches "Hello" in Bengali, Hindi, Tamil, and Telugu scripts

const regionalHello = /^(হ্যালো|नमस्ते|ஹலோ|హలో|hello)$/i;



if (regionalHello.test(transcript.trim())) {

    transcript = "Hello"; // Force the English string

    lang = "en-IN";       // Force the English voice model for the reply

}



return { transcript, languageCode: lang };

  } catch (error) {

    console.error("❌ STT Error:", error.response?.data || error.message);

    return { transcript: "", languageCode: "en-IN" };

  }

};



// 4. Text to Speech

const textToSpeech = async (text, langCode = 'hi-IN') => {

  try {

    if (!text || text.trim().length === 0) return null;



    const ttsLang = (langCode.startsWith('en')) ? 'hi-IN' : langCode;



    const res = await axios.post(`${BASE}/text-to-speech`, {

      text: text.substring(0,500),

      target_language_code: ttsLang,

      speaker: 'anushka',

      model: 'bulbul:v2',

      pitch: 0,

      pace: 1.0

    }, { headers, timeout: 30000 });



    return res.data?.audios?.[0] || null;

  } catch (error) {

    console.error("❌ TTS Error:", error.response?.data || error.message);

    return null;

  }

};



module.exports = {

  detectLanguage,

  generateReply,

  speechToText,

  textToSpeech

};