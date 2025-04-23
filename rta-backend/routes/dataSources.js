const express = require('express');
const router = express.Router();

// Sample data sources
const dataSources = [
  { id: 1, name: 'IOT Data', description: 'Smoke detection data' },
  { id: 2, name: 'Financial Data', description: 'Stock market data' },
  { id: 3, name: 'Healthcare Data', description: 'Vitals Data' },
];

// GET /api/data-sources
router.get('/', (req, res) => {
  res.json(dataSources);
});

// POST /api/selected-sources
router.post('/selected-sources', (req, res) => {
  const { selectedSources } = req.body;

  if (!selectedSources || selectedSources.length === 0) {
    return res.status(400).json({ message: 'No data sources selected' });
  }

  console.log('Selected data sources:', selectedSources);

  res.status(200).json({ message: 'Data sources selected successfully', selectedSources });
});

module.exports = router;
