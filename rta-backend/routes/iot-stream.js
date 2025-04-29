// ===============use below code If you are using normal streaming=============
require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.get('/', async (req, res) => {
  const streamUrl = "http://localhost:3001/iot-stream"; 

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await axios({
      method: 'get',
      url: streamUrl,
      responseType: 'stream'
    });

    response.data.pipe(res);

    response.data.on('end', () => {
      res.end();
    });

    const rl = readline.createInterface({
      input: response.data,
      crlfDelay: Infinity
    });
    
    for await (const line of rl) {
      if (!line.startsWith('data:')) continue;

      const jsonString = line.replace(/^data:\s*/, '');
      const data = JSON.parse(jsonString);

      const {
        ['UTC']: utc,
        ['Temperature[C]']: temp,
        ['Humidity[%]']: humidity,
        ['TVOC[ppb]']: tvoc,
        ['eCO2[ppm]']: eco2,
        ['Raw H2']: rawH2,
        ['Raw Ethanol']: ethanol,
        ['Pressure[hPa]']: pressure,
        ['PM1.0']: pm1,
        ['PM2.5']: pm2_5,
        ['NC0.5']: nc0_5,
        ['NC1.0']: nc1_0,
        ['NC2.5']: nc2_5,
        ['CNT']: cnt,
        ['Fire Alarm']: fireAlarm
      } = data;

      const { error } = await supabase.from('iot_dataset').insert([{
        utc: new Date(utc),
        temperature: parseFloat(temp),
        humidity: parseFloat(humidity),
        tvoc: parseInt(tvoc),
        eco2: parseInt(eco2),
        raw_h2: parseInt(rawH2),
        raw_ethanol: parseInt(ethanol),
        pressure: parseFloat(pressure),
        pm1: parseFloat(pm1),
        pm2_5: parseFloat(pm2_5),
        nc0_5: parseFloat(nc0_5),
        nc1_0: parseFloat(nc1_0),
        nc2_5: parseFloat(nc2_5),
        cnt: parseInt(cnt),
        fire_alarm: fireAlarm === '1'
      }]);

      if (error) {
        console.error('Insert error:', error);
      }
      
    }
  } catch (error) {
    console.error("Error connecting to data stream:", error);
    res.status(500).send("Error connecting to data stream");
  }
});

module.exports = router;

// ===============use below code If you are using kafka streaming=============
// streamData.js
// const express = require('express');
// const { Kafka } = require('kafkajs');

// const kafka = new Kafka({ clientId: 'iot-consumer', brokers: ['localhost:9092'] });
// const consumer = kafka.consumer({ groupId: 'iot-group' });
// const anomalyProducer = kafka.producer();

// const router = express.Router();
// let clients = []; 

// async function startConsumer() {
//   await consumer.connect();
//   await anomalyProducer.connect();
//   await consumer.subscribe({ topic: 'iot-data', fromBeginning: true });

//   await consumer.run({
//     eachMessage: async ({ message }) => {
//       const data = `data: ${message.value.toString()}\n\n`;
//       clients.forEach((client) => client.write(data));

//       const JSONdata = JSON.parse(message.value.toString());
      
//       const temperature = parseFloat(JSONdata['Temperature[C]']);
//       if (temperature > 50) {
//         console.log('Anomaly detected:', JSONdata);

//         await anomalyProducer.send({
//           topic: 'anomalies-topic',
//           messages: [{ value: JSON.stringify(JSONdata) }],
//         });
//         console.log('Anomaly event sent to anomalies-topic');
//       }
//     }
//   });
// }

// startConsumer().catch(console.error);

// router.get('/', (req, res) => {
//   res.setHeader('Content-Type', 'text/event-stream');
//   res.setHeader('Cache-Control', 'no-cache');
//   res.setHeader('Connection', 'keep-alive');

//   clients.push(res);
//   console.log('New client connected to data stream');

//   req.on('close', () => {
//     console.log('Client disconnected from data stream');
//     clients = clients.filter((client) => client !== res);
//   });
// });

// module.exports = router;

