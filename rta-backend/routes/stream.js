const express = require('express');
const router = express.Router();
const axios = require('axios');

// GET /api/stream – Stream data from another server
router.get('/', async (req, res) => {
  const streamUrl = "http://localhost:3001/stream"; // URL of the Node.js streaming server

  try {
    // Set the Content-Type header to "text/event-stream"
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await axios({
      method: 'get',
      url: streamUrl,
      responseType: 'stream'
    });

    // Pipe the data from the Node.js stream server to the client
    response.data.pipe(res);

    // Handle the end of the stream
    response.data.on('end', () => {
      res.end();
    });

  } catch (error) {
    console.error("Error connecting to data stream:", error);
    res.status(500).send("Error connecting to data stream");
  }
});

module.exports = router;
