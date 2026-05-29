const express = require('express');
const router = express.Router();
const aqiController = require('../controllers/aqiController');

// Search autocomplete — must be BEFORE the /:city route
router.get('/search', aqiController.searchLocations);

// Compare cities
router.get('/compare', aqiController.compareCities);

// GET /api/aqi/:city/predict
router.get('/:city/predict', aqiController.getAQIPrediction);

module.exports = router;
