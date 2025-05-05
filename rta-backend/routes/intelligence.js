const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/ask', async (req, res) => {
  const { question, source } = req.body;

  try {
    const response = await axios.post('http://localhost:8001/ask', {
      question,
      source
    });
    console.log('Response from Python agent:', response.data);
    res.json({ reply: response.data.reply });
  } catch (error) {
    console.error('Error calling Python agent:', error.message);
    res.status(500).send('Agent service failed.');
  }
});

module.exports = router;
