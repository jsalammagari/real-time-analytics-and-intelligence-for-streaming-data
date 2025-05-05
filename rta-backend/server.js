const express = require('express');
const cors = require('cors');
const routes = require('./routes'); // Import all routes
require('dotenv').config();

const app = express();
const PORT = 5050;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes); 

app.get('/', (req, res) => {
  res.send('API is running');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
