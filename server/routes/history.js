const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');

// GET /api/history/:sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const conv = await Conversation.findOne({ sessionId: req.params.sessionId });
    if (!conv) return res.json({ messages: [] });
    res.json({ messages: conv.messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
