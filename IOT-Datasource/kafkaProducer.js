const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const { Kafka } = require('kafkajs');
const dataPreprocessor = require('./dataPreprocessor');

const app = express();
const port = 3001;

const kafka = new Kafka({
  clientId: 'iot-producer',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();
let rows = [];
let index = 0;

fs.createReadStream('smoke_detection_iot.csv')
  .pipe(csv())
  .on('data', (data) => rows.push(data))
  .on('end', async () => {
    console.log('CSV file successfully processed');
    try {
      await producer.connect();
      startStreaming();
    } catch (error) {
      console.error("Error connecting to Kafka producer:", error.message);
    }
  });

async function startStreaming() {
  const intervalId = setInterval(async () => {
    if (index < rows.length) {
      const currentUTC = new Date().toISOString();

      try {
        const preprocessedRow = dataPreprocessor.preprocess(rows[index]);

        const rowWithTimestamps = {
          ...preprocessedRow,
          'UTC': currentUTC
        };

        await producer.send({
          topic: 'iot-data',
          messages: [{ value: JSON.stringify(rowWithTimestamps) }],
        });

        console.log(`Sent row ${index + 1} to Kafka`);
        index++;
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error.message);
      }
    } else {
      clearInterval(intervalId);
      await producer.disconnect();
      console.log('All data streamed to Kafka');
    }
  }, 3000);
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
