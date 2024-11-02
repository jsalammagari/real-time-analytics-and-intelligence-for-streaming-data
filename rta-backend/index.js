const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Sample data sources
const dataSources = [
  { id: 1, name: 'IOT Data', description: 'Smoke detection dataset' },
  { id: 2, name: 'Financial Data', description: 'Stock market data' },
  { id: 3, name: 'Healthcare Data', description: 'Covid-19 cases in 2020' },
];

// Routes
app.get('/', (req, res) => {
  res.send('API is running');
});

app.get('/api/data-sources', (req, res) => {
  res.json(dataSources);
});

app.post('/api/selected-sources', (req, res) => {
  const { selectedSources } = req.body;

  if (!selectedSources || selectedSources.length === 0) {
    return res.status(400).json({ message: 'No data sources selected' });
  }

  console.log('Selected data sources:', selectedSources);

  res.status(200).json({ message: 'Data sources selected successfully', selectedSources });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
