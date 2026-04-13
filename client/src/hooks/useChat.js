import { useState, useCallback } from 'react';
import { sendMessage } from '../services/api';

// ─────────────────────────────────────────────────────────
// XYZON COMPANY CONTEXT — prepended to every user message
// so the backend sarvam.js sees it as context
// ─────────────────────────────────────────────────────────
const XYZON_CONTEXT_PREFIX = `[SYSTEM: You are the official AI assistant for Xyzon Innovations Private Limited, a tech-education company in Chennai, Tamil Nadu, India. 

STRICT RULE — COMPANY-ONLY RESPONSES:
- ONLY answer questions directly about Xyzon Innovations: services, training programs, internships, placement, events, fees, contact, enrollment, team, or company info.
- If the user asks ANYTHING unrelated to Xyzon Innovations (general knowledge, coding help unrelated to Xyzon, math, news, jokes, other companies, personal advice, etc.), REFUSE POLITELY and redirect. Example refusal: "I can only help with Xyzon Innovations questions. Want to know about our training programs or placement support?"
- MULTILINGUAL: Reply in the EXACT same language/script the user uses. Tamil → Tamil, Hindi → Hindi, Tanglish → Tanglish, etc.
- Keep responses concise (2–4 sentences) for voice compatibility.
- No Markdown symbols like ** or #. Plain text only.

XYZON KNOWLEDGE BASE:
- Full Name: Xyzon Innovations Private Limited
- CIN: U85500TN2025PTC182250 | Founded: July 16, 2025 | Status: Active
- Address: Campus 1A, No.143, Dr. M.G.R. Road, Perungudi, Kanchipuram, Saidapet, Tamil Nadu – 600096
- Website: https://xyzon.in | LinkedIn: linkedin.com/company/xyzon-innovations
- Directors: Murshid Ani Sahibul Migfar, Afrin Fathimab, Thangavel Dinesh Kumar
- Mission: Bridge the gap between academic learning and industry requirements for engineering students.
- TRAINING PROGRAMS: Web Development (HTML/CSS/JS/React/PHP/MySQL), Python, Java, Data Science, AI & ML, Embedded Systems & IoT, Cloud Computing, Cybersecurity, Salesforce/CRM, Mobile App Development, Full Stack Development.
- INTERNSHIP: Available for BE/BTech/ME/MTech/BCA/BSc/MCA/MSc students in CSE, IT, ECE, EEE, Civil, Mech. Duration: 1 day to 8 weeks. Flexible batch dates daily. Certificate provided. College ID sufficient (Bonafide NOT required). Live real-world projects included.
- PLACEMENT SUPPORT: 100% placement assistance. Aptitude & reasoning training, soft skills, mock interviews, resume building, LinkedIn optimization. MNCs, IT firms, startups targeted.
- EVENT MANAGEMENT PLATFORM: SaaS product with payment gateway integration, certificate management, automated notifications, attendee management, analytics dashboard.
- ENROLLMENT: Walk-in or online via https://xyzon.in. New batches start regularly — visit website for current schedule.
- KEY MENTOR: Thangavel Dinesh Kumar — expertise in Salesforce CPQ, industry training, academic collaboration.

USER'S ACTUAL QUESTION FOLLOWS:]

`;

export const useChat = (sessionId) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (role, text, detectedLang) => {
    setMessages(prev => [
      ...prev,
      { role, text, detectedLang, id: Date.now() + Math.random() }
    ]);
  };

  const chat = useCallback(async (userText) => {
    if (!userText.trim()) return;

    // Add user message to UI immediately
    addMessage('user', userText, null);
    setIsLoading(true);

    try {
      // Inject Xyzon context into the message sent to backend
      const enrichedMessage = XYZON_CONTEXT_PREFIX + userText;

      const data = await sendMessage(sessionId, enrichedMessage, true);

      const botText = data.text || 'I apologize, please try again.';
      addMessage('bot', botText, data.detectedLang);

      // Voice playback
      if (data.audio) {
        try {
          const audioBlob = base64ToBlob(data.audio, 'audio/wav');
          const url = URL.createObjectURL(audioBlob);
          const audio = new Audio(url);
          audio.play()
            .then(() => { audio.onended = () => URL.revokeObjectURL(url); })
            .catch(err => console.warn('⚠️ Autoplay blocked:', err));
        } catch (audioErr) {
          console.warn('⚠️ Audio playback error:', audioErr);
        }
      }

    } catch (err) {
      console.error('❌ Chat error:', err);
      addMessage('bot', 'Something went wrong. Please visit https://xyzon.in or try again.', 'en-IN');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return { messages, isLoading, chat };
};

function base64ToBlob(base64, mimeType) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}