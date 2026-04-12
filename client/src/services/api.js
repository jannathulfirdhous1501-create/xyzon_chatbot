import axios from 'axios';

// The baseURL '/api' works perfectly with the Vite proxy in vite.config.js
const api = axios.create({ baseURL: '/api' });

export const sendMessage = (sessionId, message, includeAudio = true) => {
  // We send 'message' because your server/routes/chat.js uses:
  // const { sessionId, message, includeAudio } = req.body;
  return api.post('/chat', { 
    sessionId, 
    message, 
    includeAudio 
  }).then(r => r.data);
};

export const speechToText = (audioBlob) => {
  // --- DEBUG LOGS START ---
  console.log("🎤 Voice recognition triggered...");
  console.log("📦 Audio Data Details:", {
    sizeInBytes: audioBlob.size,
    mimeType: audioBlob.type
  });
  // --- DEBUG LOGS END ---

  const form = new FormData();
  // Ensure the field name is 'file' to match your server/services/sarvam.js logic
  // and the backend upload.single('file') middleware
  form.append('file', audioBlob, 'recording.wav'); 

  return api.post('/voice/stt', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  .then(r => {
    console.log("✅ Server Response (STT):", r.data);
    return r.data;
  })
  .catch(err => {
    console.error("❌ Voice API Error:", err.response?.data || err.message);
    throw err;
  });
};

export const getHistory = (sessionId) =>
  api.get(`/history/${sessionId}`).then(r => r.data);

export default api;
