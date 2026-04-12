const express = require('express');

const router = express.Router();

const multer = require('multer');

const { speechToText } = require('../services/sarvam');



const upload = multer({ storage: multer.memoryStorage() });



router.post('/stt', upload.single('file'), async (req, res) => {

  try {

    if (!req.file) {

      console.error("❌ No file found in request.");

      return res.status(400).json({ error: "No audio file provided" });

    }



    console.log(`🎤 Processing voice file: ${req.file.size} bytes`);

    const result = await speechToText(req.file.buffer, req.file.mimetype);

    res.json(result);

  } catch (err) {

    console.error('❌ STT Route Error:', err);

    res.status(500).json({ error: 'Failed to process voice' });

  }

});



module.exports = router;