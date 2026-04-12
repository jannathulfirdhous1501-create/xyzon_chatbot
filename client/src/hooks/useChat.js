import { useState, useCallback } from 'react';
import { sendMessage } from '../services/api';

export const useChat = (sessionId) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (role, text, lang) => {
    setMessages(prev => [...prev, { role, text, lang, id: Date.now() + Math.random() }]);
  };

  const chat = useCallback(async (text) => {
    if (!text.trim()) return;
    
    // Add user message to UI
    addMessage('user', text, null);
    setIsLoading(true);
    
    try {
      // Send message to backend with includeAudio set to true
      const data = await sendMessage(sessionId, text, true);
      
      const botText = data.text || "No response received";
      addMessage('bot', botText, data.detectedLang);

      // --- VOICE PLAYBACK LOGIC ---
      if (data.audio) {
        console.log("🔊 AI Voice received, playing...");
        
        // Convert Base64 string to a Blob
        const audioBlob = base64ToBlob(data.audio, 'audio/wav');
        const url = URL.createObjectURL(audioBlob);
        
        const audio = new Audio();
        audio.src = url;
        
        // Play the audio and handle potential browser blocks
        audio.play()
          .then(() => {
            // Cleanup memory after playing
            audio.onended = () => URL.revokeObjectURL(url);
          })
          .catch(err => {
            console.warn("⚠️ Autoplay blocked. Click on the chat to enable audio.", err);
          });
      }
    } catch (err) {
      console.error("❌ Frontend Chat Error:", err);
      addMessage('bot', 'Oops! Something went wrong.', 'en-IN');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return { messages, isLoading, chat };
};

// Helper function to decode Base64
function base64ToBlob(base64, mimeType) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}