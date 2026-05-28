const aqiService = require('../services/aqiService');
const searchService = require('../services/searchService');
const compareService = require('../services/compareService');
const aiService = require('../services/aiService');
const { formatAQIResponse } = require('../utils/responseFormatter');
const { calculateAQI } = require('../utils/aqiCalculator');
const cache = require('../cache');

/**
 * GET /aqi/:city/predict
 */
async function getAQIPrediction(req, res, next) {
    try {
        const city = req.params.city?.trim();

        if (!city) {
            return res.status(400).json({ error: 'City name is required.' });
        }

        const cacheKey = `aqi_${city.toLowerCase()}`;
        const cached = cache.get(cacheKey);

        if (cached) {
            return res.json(cached);
        }

        const {
            pollutants,
            weather,
            coordinates,
            resolvedName,
            country,
            currentAQI
        } = await aqiService.getAQIData(city);

        const displayCity = resolvedName || city;

        const calculatedAqiData = calculateAQI(pollutants);
        const finalCurrentAQI = calculatedAqiData ? calculatedAqiData.aqi : (currentAQI || 50);

        const aiFeatures = {
            latitude: coordinates.lat,
            longitude: coordinates.lon,
            pm25: pollutants.pm25,
            pm10: pollutants.pm10,
            no2: pollutants.no2,
            so2: pollutants.so2,
            o3: pollutants.o3,
            co: pollutants.co,
            temperature: weather.temperature,
            humidity: weather.humidity,
            wind_speed: weather.windSpeed,
            wind_direction: weather.windDirection,
            pressure: weather.pressure,
        };

        let aiPrediction = null;
        try {
            aiPrediction = await aiService.getPrediction(finalCurrentAQI, aiFeatures);
        } catch (e) {
            console.error("AI Service Error: ", e.message);
        }

        const response = formatAQIResponse(
            displayCity,
            pollutants,
            weather,
            aiPrediction,
            coordinates
        );

        response.country = country || null;

        cache.set(cacheKey, response);

        return res.json(response);

    } catch (err) {
        console.error('AQI prediction error:', err.message);
        return res.status(500).json({ error: err.message || 'AQI fetch failed' });
    }
}

/**
 * Search locations
 */
async function searchLocations(req, res, next) {
    try {
        const query = req.query.q?.trim();

        if (!query || query.length < 2) {
            return res.json([]);
        }

        const cacheKey = `search_${query.toLowerCase()}`;
        const cached = cache.get(cacheKey);

        if (cached) {
            return res.json(cached);
        }

        const results = await searchService.searchLocations(query);

        cache.set(cacheKey, results, 120);

        return res.json(results);

    } catch (err) {
        console.error('Search error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

/**
 * Compare AQI
 */
async function compareCities(req, res, next) {
    try {
        const { city1, city2 } = req.query;

        if (!city1 || !city2) {
            return res.status(400).json({ error: 'Both city1 and city2 are required.' });
        }

        const cacheKey = `compare_${city1.toLowerCase()}_${city2.toLowerCase()}`;
        const cached = cache.get(cacheKey);

        if (cached) {
            return res.json(cached);
        }

        const result = await compareService.compareCities(city1.trim(), city2.trim());

        cache.set(cacheKey, result);

        return res.json(result);

    } catch (err) {
        console.error('Compare error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getAQIPrediction,
    searchLocations,
    compareCities,
};