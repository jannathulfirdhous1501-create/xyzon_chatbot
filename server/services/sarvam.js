const axios = require('axios');
const FormData = require('form-data');

const BASE = "https://api.sarvam.ai";
const KEY = process.env.SARVAM_API_KEY || "sk_i5in7cwi_5XzAynJDt0dsukCCOK0AIjYq";

const headers = {
  'api-subscription-key': KEY,
  'Content-Type': 'application/json'
};

// ─────────────────────────────────────────────────────────
// XYZON SYSTEM PROMPT
// ─────────────────────────────────────────────────────────
const XYZON_SYSTEM_PROMPT = `You are the official AI assistant for Xyzon Innovations Private Limited, a tech-education company in Chennai, Tamil Nadu, India.

ABSOLUTE RULES:
1. COMPANY-ONLY (STRICTEST RULE): Only answer questions directly about Xyzon Innovations.
   EXCEPTION: If the user sends a greeting (hi, hello, namaste, vanakkam, hey, good morning, etc. in any language), respond warmly and friendly in their language, introduce yourself as Xyzon's digital assistant, and invite them to ask about our courses, internships, or placements.
   For ALL other unrelated topics (fruit prices, music, math, news, other companies, personal advice, etc.), reply with EXACTLY this and NOTHING else:
   "I specialize in Xyzon Innovations' tech-education programs. Let me know if you need details about our courses, internships, or placements!"

2. SCRIPT MATCHING (CRITICAL): Reply in the EXACT same script the user used.
   - Devanagari (Hindi/Marathi script like यह, क्या) → Reply ONLY in Devanagari script
   - Tamil script (like எனக்கு, என்ன) → Reply ONLY in Tamil script
   - Malayalam script (like ഈ, എന്ത്) → Reply ONLY in Malayalam script
   - Telugu script → Reply ONLY in Telugu script
   - Kannada script → Reply ONLY in Kannada script
   - Bengali script → Reply ONLY in Bengali script
   - Roman English → Reply in English
   - Hinglish Roman (kahan hai, kya hai) → Reply in Hinglish Roman letters
   - Tanglish Roman (enna, sollu) → Reply in Tanglish Roman letters
   NEVER transliterate. NEVER mix scripts.

3. VOICE-OPTIMIZED: Keep responses to 3 sentences maximum. No long lists. No essays.
4. CLEAN OUTPUT: No Markdown symbols (no **, no #, no bullet points). Plain text only.
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
- EVENT PLATFORM: SaaS with payment integration, certificates, notifications, analytics.
- ENROLLMENT: Visit https://xyzon.in or walk-in. New batches start regularly.`;

// ─────────────────────────────────────────────────────────
// Script detection — returns script name from Unicode ranges
// ─────────────────────────────────────────────────────────
const detectScript = (text) => {
  if (/[\u0900-\u097F]/.test(text)) return 'devanagari';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'tamil';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'malayalam';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'telugu';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kannada';
  if (/[\u0980-\u09FF]/.test(text)) return 'bengali';
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gujarati';
  if (/[\u0A00-\u0A7F]/.test(text)) return 'gurmukhi';
  if (/[\u0B00-\u0B7F]/.test(text)) return 'odia';
  if (/^[A-Za-z0-9\s!@#$%^&*(),.?":{}|<>'`~\-_+=;/\\[\]]+$/.test(text)) return 'roman';
  return 'unknown';
};

// ─────────────────────────────────────────────────────────
// Shared Roman language regexes — single source of truth
// NOTE: Order matters — more specific languages first, Hindi last
// ─────────────────────────────────────────────────────────
const ROMAN_PATTERNS = [
  {
    lang: 'te-IN',
    label: 'Tenglish',
    desc: 'Telugu in Roman letters',
    re: /\b(untaya|lekapothe|undo|atho|mathrame|cheppandi|chala|bagundi|emi|ekkada|katti|mela|enadru|ideya|ayyindi|chesaru|ledu|avunu|unnaru|cheyyadam|adugutunnaru|telugu|meeru|maku|mee|nenu)\b/i
  },
  {
    lang: 'kn-IN',
    label: 'Kanglish',
    desc: 'Kannada in Roman letters',
    re: /\b(bekagide|thumba|swalpa|avru|navu|nimma|naanu|hogbeku|bandru|kelsa|barteeni|madtini|kannada|illi|enu|yenu|yelli|illa|ide|madu)\b/i
  },
  {
    lang: 'ml-IN',
    label: 'Manglish',
    desc: 'Malayalam in Roman letters',
    re: /\b(aano|alle|ente|njan|ningal|ivide|evide|enthanu|mathrame|adipoli|sheriyanu|undoo|ingane|engane|avr|avar|onnum|ellam|kittum|kittathe|thanne)\b/i
  },
  {
    lang: 'bn-IN',
    label: 'Banglish',
    desc: 'Bengali in Roman letters',
    re: /\b(jana|khub|dorkar|ache|hobe|korte|gele|ami|tumi|apni|lagbe|jacche|ashbe|thakbe|pabo|korbo|dekhun|bolun|kemon|kothay)\b/i
  },
  {
    lang: 'mr-IN',
    label: 'Marathish',
    desc: 'Marathi in Roman letters',
    re: /\b(ahe|pahije|hota|sakal|mazha|tumcha|aplya|aahe|yeil|jaail|milel|ghya|dya|sangto|bagha|asa|tasa|aplya|konti|vela)\b/i
  },
  {
    lang: 'ta-IN',
    label: 'Tanglish',
    desc: 'Tamil in Roman letters',
    re: /\b(enna|epdi|evlo|yaar|naan|sollu|illai|theriyum|iruku|romba|konjam|seri|nee|avan|aval|inge|paaru|pannuva|solla|kekkum|vendam|venum)\b/i
  },
  {
    lang: 'hi-IN',
    label: 'Hinglish',
    desc: 'Hindi in Roman letters',
    re: /\b(kahan|kya|hai|mein|aap|hum|yeh|woh|bhi|aur|nahi|haan|batao|bolo|chahiye|milega|kitna|kyun|kaisa|kab|dekho|suno|karo)\b/i
  }
];

// Maps script name → Sarvam language code for TTS & badge
const scriptToLangCode = (script, text) => {
  switch (script) {
    case 'devanagari': return 'hi-IN';
    case 'tamil':      return 'ta-IN';
    case 'malayalam':  return 'ml-IN';
    case 'telugu':     return 'te-IN';
    case 'kannada':    return 'kn-IN';
    case 'bengali':    return 'bn-IN';
    case 'gujarati':   return 'gu-IN';
    case 'gurmukhi':   return 'pa-IN';
    case 'odia':       return 'or-IN';
    case 'roman': {
      console.log('🔍 scriptToLangCode roman input:', JSON.stringify(text));
      for (const pattern of ROMAN_PATTERNS) {
        const matched = pattern.re.test(text);
        console.log(`🔍 Testing ${pattern.label}: ${matched}`);
        if (matched) {
          console.log(`✅ Matched ${pattern.label} → ${pattern.lang}`);
          return pattern.lang;
        }
      }
      console.log('⚠️ No roman pattern matched → en-IN');
      return 'en-IN';
    }
    default: return 'en-IN';
  }
};

const getScriptRule = (script, text) => {
  switch (script) {
    case 'devanagari':
      return `CRITICAL: User wrote in Devanagari script. Reply ENTIRELY in Devanagari/Hindi script. Every word must be in Hindi. No Roman letters. Example: "Xyzon Innovations चेन्नई, तमिलनाडु में स्थित है।"`;
    case 'tamil':
      return `CRITICAL: User wrote in Tamil script. Reply ENTIRELY in Tamil script. No English or Roman letters.`;
    case 'malayalam':
      return `CRITICAL: User wrote in Malayalam script. Reply ENTIRELY in Malayalam script. No English or Roman letters.`;
    case 'telugu':
      return `CRITICAL: User wrote in Telugu script. Reply ENTIRELY in Telugu script. No English or Roman letters.`;
    case 'kannada':
      return `CRITICAL: User wrote in Kannada script. Reply ENTIRELY in Kannada script. No English or Roman letters.`;
    case 'bengali':
      return `CRITICAL: User wrote in Bengali script. Reply ENTIRELY in Bengali script. No English or Roman letters.`;
    case 'roman': {
      console.log('🔍 getScriptRule roman input:', JSON.stringify(text));
      for (const pattern of ROMAN_PATTERNS) {
        const matched = pattern.re.test(text);
        console.log(`🔍 Testing ${pattern.label}: ${matched}`);
        if (matched) {
          console.log(`✅ Matched ${pattern.label} → replying in ${pattern.desc}`);
          return `User is writing ${pattern.label} (${pattern.desc}). Reply in ${pattern.label} — mix ${pattern.desc.split(' in ')[0]} and English words using only Roman script. Do NOT use native script. Do NOT use other Indian language words.`;
        }
      }
      console.log('⚠️ No roman pattern matched → plain English');
      return `User is writing in English. Reply in clear, simple English.`;
    }
    default:
      return `Match the user's language exactly.`;
  }
};

// ─────────────────────────────────────────────────────────
// Smart TTS truncation — cuts at sentence boundary
// ─────────────────────────────────────────────────────────
const smartTruncate = (text, maxChars = 800) => {
  if (text.length <= maxChars) return text;

  const chunk = text.substring(0, maxChars);
  const lastPunct = Math.max(
    chunk.lastIndexOf('।'),
    chunk.lastIndexOf('.'),
    chunk.lastIndexOf('?'),
    chunk.lastIndexOf('!'),
    chunk.lastIndexOf('。')
  );

  if (lastPunct > maxChars * 0.5) {
    return chunk.substring(0, lastPunct + 1).trim();
  }

  const lastSpace = chunk.lastIndexOf(' ');
  return lastSpace > 0 ? chunk.substring(0, lastSpace).trim() : chunk.trim();
};

// ─────────────────────────────────────────────────────────
// 1. Detect Language (used for badge)
// ─────────────────────────────────────────────────────────
const detectLanguage = async (text) => {
  const script = detectScript(text);
  const langCode = scriptToLangCode(script, text);
  console.log(`🏷️  Badge lang: script=${script} → ${langCode}`);
  return langCode;
};

// ─────────────────────────────────────────────────────────
// 2. Generate Reply
// ─────────────────────────────────────────────────────────
const generateReply = async (userText, history = []) => {
  try {
    const cleanUserText = userText.replace(/^\[SYSTEM:[\s\S]*?\]\s*/i, '').trim();

    const script = detectScript(cleanUserText);
    const scriptRule = getScriptRule(script, cleanUserText);

    console.log(`🌐 Script detected: ${script} | Rule: ${scriptRule.substring(0, 80)}...`);

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

    const ttsLang = langCode || 'hi-IN';
    const ttsText = smartTruncate(text, 800);
    console.log(`🔊 TTS: lang=${ttsLang}, original=${text.length} chars, sending=${ttsText.length} chars`);

    const res = await axios.post(`${BASE}/text-to-speech`, {
      text: ttsText,
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
      console.warn('⚠️ TTS: No audio in response', res.data);
      return null;
    }

    console.log('✅ TTS audio generated successfully');
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
  textToSpeech,
  detectScript,
  scriptToLangCode
};