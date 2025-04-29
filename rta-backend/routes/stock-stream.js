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
  const streamUrl = "http://localhost:3001/stock-stream"; 

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
        ['SPY']: spy,
        ['QQQ']: qqq,
        ['IWM']: iwm,
        ['AAPL']: aapl,
        ['MSFT']: msft,
        ['NVDA']: nvda,
        ['VIX']: vix
      } = data;

      const { error } = await supabase.from('stock_dataset').insert([{
        utc: new Date(utc),
        spy: parseFloat(spy),
        qqq: parseFloat(qqq),
        iwm: parseFloat(iwm),
        aapl: parseFloat(aapl),
        msft: parseFloat(msft),
        nvda: parseFloat(nvda),
        vix: parseFloat(vix)
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

// const kafka = new Kafka({ clientId: 'stock-consumer', brokers: ['localhost:9092'] });
// const consumer = kafka.consumer({ groupId: 'stock-group' });
// const anomalyProducer = kafka.producer();

// const router = express.Router();
// let clients = []; 

// async function startConsumer() {
//   await consumer.connect();
//   await anomalyProducer.connect();
//   await consumer.subscribe({ topic: 'stock-data', fromBeginning: true });

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

