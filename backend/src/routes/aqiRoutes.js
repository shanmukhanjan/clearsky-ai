const express = require('express');

const router = express.Router();

const aqiController =
    require('../controllers/aqiController');

/**
 * Search locations
 */
router.get(
    '/search',
    aqiController.searchLocations
);

/**
 * Compare cities
 */
router.get(
    '/compare',
    aqiController.compareCities
);

/**
 * IMPORTANT FIX:
 * Use wildcard route for coordinates
 */
router.get(
    '/*/predict',
    (req, res, next) => {

        try {

            const fullPath =
                req.params[0];

            req.params.city =
                decodeURIComponent(fullPath);

            next();

        } catch (err) {

            next(err);
        }

    },
    aqiController.getAQIPrediction
);

module.exports = router;