const axios = require('axios');
const FormData = require('form-data');

const BASE = "https://api.sarvam.ai";
const KEY = process.env.SARVAM_API_KEY || "sk_i5in7cwi_5XzAynJDt0dsukCCOK0AIjYq";

const headers = {
  'api-subscription-key': KEY,
  'Content-Type': 'application/json'
};

// ─────────────────────────────────────────────────────────
// XYZON SERVER-SIDE SYSTEM PROMPT
// ─────────────────────────────────────────────────────────
const XYZON_SYSTEM_PROMPT = `You are the official AI assistant for Xyzon Innovations Private Limited, a tech-education company in Chennai, Tamil Nadu, India.

ABSOLUTE RULES:
1. COMPANY-ONLY: Only answer questions about Xyzon Innovations. If the user asks anything unrelated (general knowledge, coding tutorials, news, other companies, math, jokes, personal advice), REFUSE politely and redirect to Xyzon topics.
2. SCRIPT MATCHING (MOST IMPORTANT RULE):
   - If the user writes in Devanagari script (Hindi, Marathi) → Reply ONLY in Devanagari script. Example: "यह कंपनी कहाँ है?" → reply fully in Hindi Devanagari like "Xyzon Innovations चेन्नई, तमिलनाडु में स्थित है।"
   - If the user writes in Tamil script → Reply ONLY in Tamil script.
   - If the user writes in Malayalam script → Reply ONLY in Malayalam script.
   - If the user writes in Telugu script → Reply ONLY in Telugu script.
   - If the user writes in Kannada script → Reply ONLY in Kannada script.
   - If the user writes in Bengali script → Reply ONLY in Bengali script.
   - If the user writes ONLY in English → Reply in English.
   - If the user mixes Hindi+English (Hinglish like "company kahan hai") → Reply in Hinglish using Roman letters.
   - NEVER mix scripts. NEVER transliterate a native script question into Roman letters.
3. VOICE-OPTIMIZED: Keep every response between 2 to 4 sentences. No long lists.
4. CLEAN OUTPUT: No Markdown (no **, no #). Plain text only for TTS.
5. NEVER say "I understand. How else can I help you?" — always be specific.

XYZON KNOWLEDGE BASE:
- Full Name: Xyzon Innovations Private Limited
- CIN: U85500TN2025PTC182250 | Founded: July 2025 | Status: Active
- Address: Campus 1A, No.143, Dr. M.G.R. Road, Perungudi, Saidapet, Tamil Nadu 600096
- Website: https://xyzon.in | LinkedIn: linkedin.com/company/xyzon-innovations
- Directors: Murshid Ani Sahibul Migfar, Afrin Fathimab, Thangavel Dinesh Kumar
- Mission: Bridge gap between academics and industry for engineering students
- PROGRAMS: Web Development, Python, Java, Data Science, AI/ML, Embedded Systems/IoT, Cloud Computing, Cybersecurity, Salesforce/CRM, Mobile App Development, Full Stack
- INTERNSHIP: BE/BTech/ME/MTech/BCA/BSc/MCA/MSc students. Duration 1 day to 8 weeks. College ID sufficient. Daily new batches. Certificate provided. Live projects included.
- PLACEMENT: 100% placement assistance. Aptitude, soft skills, mock interviews, resume building. MNCs and IT firms targeted.
- EVENT PLATFORM: SaaS product with payment integration, certificates, notifications, analytics.
- ENROLLMENT: Visit https://xyzon.in or walk-in. New batches start regularly.`;

// ─────────────────────────────────────────────────────────
// Script detection helper
// ─────────────────────────────────────────────────────────
const detectScript = (text) => {
  if (/[\u0900-\u097F]/.test(text)) return 'devanagari'; // Hindi, Marathi
  if (/[\u0B80-\u0BFF]/.test(text)) return 'tamil';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'malayalam';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'telugu';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kannada';
  if (/[\u0980-\u09FF]/.test(text)) return 'bengali';
  if (/[\u0A00-\u0A7F]/.test(text)) return 'gurmukhi'; // Punjabi
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gujarati';
  if (/[\u0B00-\u0B7F]/.test(text)) return 'odia';
  if (/^[A-Za-z0-9\s!@#$%^&*(),.?":{}|<>'`~\-_+=;/\\[\]]+$/.test(text)) return 'roman';
  return 'unknown';
};

const getScriptRule = (script, cleanText) => {
  switch (script) {
    case 'devanagari':
      return `CRITICAL: The user wrote in Devanagari (Hindi/Marathi) script. You MUST reply ENTIRELY in Devanagari script. Every single word must be in Hindi/Devanagari. Do NOT use Roman letters or English words at all. Example of correct reply: "Xyzon Innovations चेन्नई, तमिलनाडु में स्थित है। अधिक जानकारी के लिए xyzon.in पर जाएं।"`;
    case 'tamil':
      return `CRITICAL: The user wrote in Tamil script. You MUST reply ENTIRELY in Tamil script. No English or Roman letters.`;
    case 'malayalam':
      return `CRITICAL: The user wrote in Malayalam script. You MUST reply ENTIRELY in Malayalam script. No English or Roman letters.`;
    case 'telugu':
      return `CRITICAL: The user wrote in Telugu script. You MUST reply ENTIRELY in Telugu script. No English or Roman letters.`;
    case 'kannada':
      return `CRITICAL: The user wrote in Kannada script. You MUST reply ENTIRELY in Kannada script. No English or Roman letters.`;
    case 'bengali':
      return `CRITICAL: The user wrote in Bengali script. You MUST reply ENTIRELY in Bengali script. No English or Roman letters.`;
    case 'roman':
      // Check if it looks like Hinglish or Tanglish
      const hindiRomanWords = /\b(kahan|kya|hai|mein|ka|ki|ke|aap|hum|yeh|woh|bhi|aur|nahi|haan|theek|batao|bolo|dekho|suno|chalte|karo)\b/i;
      const tamilRomanWords = /\b(enna|epdi|evlo|yaar|naan|nee|avan|aval|inge|ange|vendaam|theriyum|illai|sollu|paaru|vaa|po)\b/i;
      if (hindiRomanWords.test(cleanText)) {
        return `The user is writing Hinglish (Hindi in Roman letters). Reply in Hinglish using Roman letters with Hindi and English words mixed. Example: "Xyzon Innovations Chennai mein hai, Tamil Nadu mein. Aap zyada info ke liye xyzon.in visit kar sakte hain!"`;
      }
      if (tamilRomanWords.test(cleanText)) {
        return `The user is writing Tanglish (Tamil in Roman letters). Reply in Tanglish using Roman letters with Tamil and English words. No Hindi words.`;
      }
      return `The user is writing in English. Reply in clear, simple English.`;
    default:
      return `Match the user's language exactly in your reply.`;
  }
};

// ─────────────────────────────────────────────────────────
// 1. Detect Language
// ─────────────────────────────────────────────────────────
const detectLanguage = async (text) => {
  try {
    const res = await axios.post(`${BASE}/text-to-text/language-identification/v1`, {
      input: text
    }, { headers, timeout: 5000 });
    return res.data.language_code || 'en-IN';
  } catch {
    return 'en-IN';
  }
};

// ─────────────────────────────────────────────────────────
// 2. Generate Reply
// ─────────────────────────────────────────────────────────
const generateReply = async (userText, history = []) => {
  try {
    // Strip the [SYSTEM:...] prefix injected by client if present
    const cleanUserText = userText.replace(/^\[SYSTEM:[\s\S]*?\]\s*/i, '').trim();

    // Detect which script the user actually used
    const script = detectScript(cleanUserText);
    const scriptRule = getScriptRule(script, cleanUserText);

    console.log(`🌐 Script detected: ${script} | Rule: ${scriptRule.substring(0, 60)}...`);

    const systemMessage = {
      role: 'system',
      content: `${XYZON_SYSTEM_PROMPT}\n\nLANGUAGE INSTRUCTION FOR THIS MESSAGE:\n${scriptRule}`
    };

    const messages = [
      systemMessage,
      { role: 'user', content: cleanUserText }
    ];

    const res = await axios.post(`${BASE}/v1/chat/completions`, {
      model: 'sarvam-m',
      messages,
      temperature: 0.7
    }, { headers, timeout: 15000 });

    let aiReply = res.data.choices[0].message.content;
    return aiReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  } catch (error) {
    console.error("❌ LLM Error:", error.response?.data || error.message);
    return "Sorry, I'm having trouble connecting. Please visit https://xyzon.in or try again shortly.";
  }
};

// ─────────────────────────────────────────────────────────
// 3. Speech to Text
// ─────────────────────────────────────────────────────────
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

    let transcript = res.data.transcript || "";
    let lang = res.data.language_code || 'en-IN';

    const regionalHello = /^(হ্যালো|नमस्ते|ஹலோ|హలో|hello)$/i;
    if (regionalHello.test(transcript.trim())) {
      transcript = "Hello";
      lang = "en-IN";
    }

    return { transcript, languageCode: lang };
  } catch (error) {
    console.error("❌ STT Error:", error.response?.data || error.message);
    return { transcript: "", languageCode: "en-IN" };
  }
};

// ─────────────────────────────────────────────────────────
// 4. Text to Speech
// ─────────────────────────────────────────────────────────
const textToSpeech = async (text, langCode = 'hi-IN') => {
  try {
    if (!text || text.trim().length === 0) return null;

    const ttsLang = langCode.startsWith('en') ? 'hi-IN' : langCode;

    const res = await axios.post(`${BASE}/text-to-speech`, {
      text: text.substring(0, 500),
      target_language_code: ttsLang,
      speaker: 'anushka',
      model: 'bulbul:v2',
      pitch: 0,
      pace: 1.0
    }, {
      headers,
      timeout: 30000,
      responseType: 'json'
    });

    const audio = res.data?.audios?.[0];
    if (!audio) {
      console.warn('⚠️ TTS: No audio in response');
      return null;
    }
    return audio;

  } catch (error) {
    const errMsg = error.code || error.message || '';
    if (errMsg.includes('ABORTED') || errMsg.includes('ECONNRESET') || errMsg.includes('stream')) {
      console.warn('⚠️ TTS stream aborted — skipping audio');
    } else {
      console.error("❌ TTS Error:", error.response?.data || error.message);
    }
    return null;
  }
};

module.exports = {
  detectLanguage,
  generateReply,
  speechToText,
  textToSpeech
};