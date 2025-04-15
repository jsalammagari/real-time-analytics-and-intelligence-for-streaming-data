const express = require('express');
const dataSourcesRoute = require('./dataSources');
const iotStreamRoute = require('./iot-stream');
const iotAnomalyStreamRoute = require('./iot-streamAnomaly');
const healthcareStreamRoute = require('./healthcare-stream');

const router = express.Router();

// Use individual routes
router.use('/data-sources', dataSourcesRoute);
router.use('/iot-stream', iotStreamRoute);
router.use('/iot-stream-anomaly', iotAnomalyStreamRoute);
router.use('/healthcare-stream', healthcareStreamRoute);

module.exports = router;
