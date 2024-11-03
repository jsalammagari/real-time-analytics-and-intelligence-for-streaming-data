const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const port = 3001;

let rows = [];
let index = 0;

fs.createReadStream('smoke_detection_iot.csv')
  .pipe(csv())
  .on('data', (data) => rows.push(data))
  .on('end', () => {
    console.log('CSV file successfully processed');
  });

app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); 

  const startTime = Date.now();

  const intervalId = setInterval(() => {
    if (index < rows.length) {
      const currentUTC = new Date(startTime + index * 3000).toISOString();

      const rowWithTimestamps = {
        ...rows[index],
        'UTC': currentUTC
      };

      res.write(`data: ${JSON.stringify(rowWithTimestamps)}\n\n`);
      index++;
    } else {
      clearInterval(intervalId);
      res.write('data: End of data\n\n');
      res.end();
    }
  }, 3000); 

  req.on('close', () => {
    clearInterval(intervalId);
    console.log('Client closed connection');
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
