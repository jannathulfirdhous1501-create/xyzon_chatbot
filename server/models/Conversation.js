const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  englishText: { type: String }, // ADD THIS LINE
  detectedLang: { type: String, default: 'hi-IN' }, // Default to Hindi
  isVoice: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', conversationSchema);