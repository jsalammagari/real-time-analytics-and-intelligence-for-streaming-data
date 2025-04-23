const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const port = 3001;

let iotRows = [];
let iotIndex = 0;
let healthcareRows = [];
let healthcareIndex = 0;
let stockRows = [];
let stockIndex = 0;

fs.createReadStream('smoke_detection_iot.csv')
  .pipe(csv())
  .on('data', (data) => iotRows.push(data))
  .on('end', () => {
    console.log('IOT- CSV file successfully processed');
  });

fs.createReadStream('stock_dataset.csv')
  .pipe(csv())
  .on('data', (data) => stockRows.push(data))
  .on('end', () => {
    console.log('Stock CSV file successfully processed');
  });

fs.createReadStream('CVD_Vital_SIgns.csv')
  .pipe(csv())
  .on('data', (data) => healthcareRows.push(data))
  .on('end', () => console.log('Healthcare CSV loaded'));

app.get('/iot-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); 

  const startTime = Date.now();

  const intervalId = setInterval(() => {
    if (iotIndex < iotRows.length) {
      const currentUTC = new Date(startTime + iotIndex * 3000).toISOString();

      const rowWithTimestamps = {
        ...iotRows[iotIndex],
        'UTC': currentUTC
      };

      res.write(`data: ${JSON.stringify(rowWithTimestamps)}\n\n`);
      iotIndex++;
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

app.get('/stock-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); 

  const startTime = Date.now();

  const intervalId = setInterval(() => {
    if (stockIndex < stockRows.length) {
      const currentUTC = new Date(startTime + stockIndex * 3000).toISOString();

      const rowWithTimestamps = {
        ...stockRows[stockIndex],
        'UTC': currentUTC
      };

      res.write(`data: ${JSON.stringify(rowWithTimestamps)}\n\n`);
      stockIndex++;
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

app.get('/healthcare-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); 

  const startTime = Date.now();

  const intervalId = setInterval(() => {
    if (healthcareIndex < healthcareRows.length) {
      const currentUTC = new Date(startTime + healthcareIndex * 3000).toISOString();

      const rowWithTimestamps = {
        ...healthcareRows[healthcareIndex],
        'UTC': currentUTC
      };

      res.write(`data: ${JSON.stringify(rowWithTimestamps)}\n\n`);
      healthcareIndex++;
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