const express = require('express');
const dataSourcesRoute = require('./dataSources');
const streamRoute = require('./stream');

const router = express.Router();

// Use individual routes
router.use('/data-sources', dataSourcesRoute);
router.use('/stream', streamRoute);

module.exports = router;
