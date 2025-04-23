const express = require('express');
const dataSourcesRoute = require('./dataSources');
const iotStreamRoute = require('./iot-stream');
const iotAnomalyStreamRoute = require('./iot-streamAnomaly');
const healthcareStreamRoute = require('./healthcare-stream');
const stockStreamRoute = require('./stock-stream');

const router = express.Router();

// Use individual routes
router.use('/data-sources', dataSourcesRoute);
router.use('/iot-stream', iotStreamRoute);
router.use('/iot-stream-anomaly', iotAnomalyStreamRoute);
router.use('/healthcare-stream', healthcareStreamRoute);
router.use('/stock-stream', stockStreamRoute);

module.exports = router;
