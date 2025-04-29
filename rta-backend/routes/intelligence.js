require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');


const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getSQLFromGroq(question, source) {

  var prompt = '';

  if(source === 'IoT') {
    prompt = `
      You are a SQL expert assistant. Convert this question into a SQL query for a PostgreSQL database.
      Table name: iot_dataset  
      Columns: utc (timestamp), temperature (float), humidity (float), tvoc (int), eco2 (int), raw_h2 (int), raw_ethanol (int), pressure (float), pm1 (float), pm2_5 (float), nc0_5 (float), nc1_0 (float), nc2_5 (float), cnt (int), fire_alarm (boolean)
      Question: ${question}
      Respond ONLY with the SQL query. If you cannot directly answer by a SQL query, respond with "I cannot answer this question."`;
  }else if(source === 'Stock') {
    prompt = `
      You are a SQL expert assistant. Convert this question into a SQL query for a PostgreSQL database.
      Table name: stock_dataset
      Columns: utc (timestamp), spy (float), qqq (float), iwm (float), aapl (float), msft (float), nvda (float), vix (float), 
      Question: ${question}
      Respond ONLY with the SQL query. If you cannot directly answer by a SQL query, respond with "I cannot answer this question."`;
  }else{
    prompt = `
      You are a SQL expert assistant. Convert this question into a SQL query for a PostgreSQL database.
      Table name: healthcare_dataset
      Columns: utc (timestamp), heart_rate (float), blood_pressure (float), oxygen_saturation (float), respiratory_rate (float), temperature (float), Label (int), 
      Question: ${question}
      Respond ONLY with the SQL query. If you cannot directly answer by a SQL query, respond with "I cannot answer this question."`;
  }

  const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: 'llama3-70b-8192',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.choices[0].message.content.trim();
}

async function runQuery(sql) {
  let cleanedSql = sql
    .trim()
    .replace(/^```sql\s*/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();

  // Remove trailing semicolon if it exists
  if (cleanedSql.endsWith(';')) {
    cleanedSql = cleanedSql.slice(0, -1);
  }
  console.log('Cleaned SQL:', cleanedSql);


  const { data, error } = await supabase.rpc('execute_sql', { query_text: cleanedSql });
  
  if (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
  
  return data;
}

async function generateInsightfulReply(question, queryResult) {
  const prompt = `
    User asked: "${question}"
    SQL query result: ${JSON.stringify(queryResult)}

    Generate a helpful, clear, and concise answer for the user based on this data.
    Avoid technical jargon and write like you're explaining to a smart friend.`;

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('Groq AI error:', err);
    return 'Sorry, I couldn\'t generate a response.';
  }
}

router.post('/ask', async (req, res) => {
  const { question, source } = req.body;

  try {
    let aiReply = '';
    const sql = await getSQLFromGroq(question, source);
    console.log('Generated SQL by Groq:', sql);

    if(sql.includes('I cannot answer this question.')) {
      return res.json({ reply: 'I cannot answer this question.' });
    } else{
      const result = await runQuery(sql);
      console.log('Query Result:', result);

      aiReply = await generateInsightfulReply(question, result);
      console.log('Generated Response:', aiReply);
    }
    
    res.json({ reply: aiReply });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Something went wrong while processing your request.');
  }
});


module.exports = router;