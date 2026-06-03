const axios = require('axios');
const aqiService = require('../services/aqiService');
const searchService = require('../services/searchService');
const compareService = require('../services/compareService');
const { formatAQIResponse } = require('../utils/responseFormatter');
const { calculateAQI } = require('../utils/aqiCalculator');
const cache = require('../cache');
const env = require('../config/env');

/**
 * GET /api/aqi/:city/predict
 * Main AQI endpoint — fetches pollutants, weather, and AI prediction.
 */
async function getAQIPrediction(req, res, next) {
    try {
        const city = req.params.city?.trim();
        if (!city) {
            return res.status(400).json({ error: 'City name is required.' });
        }

        const cacheKey = `aqi_${city.toLowerCase()}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);

        const { pollutants, weather, coordinates, resolvedName, country } = await aqiService.getAQIData(city);

        // Use resolved name (proper place name) as display city
        const displayCity = resolvedName || city;
        
        // Step 1: Compute current AQI to pass to the AI service
        const aqiResult = calculateAQI(pollutants);
        if (!aqiResult) {
            throw new Error('Unable to compute AQI from provided pollutant data.');
        }

        // Try to get AI prediction from the Python service
        let aiPrediction = null;
        try {
            const aiRes = await axios.post(`${env.AI_SERVICE_URL}/predict`, {
                currentAQI: aqiResult.aqi,
                features: {
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
                    wind_direction: weather.windDirection || 0,
                    pressure: weather.pressure,
                    precipitation: 0,
                    uv_index: 0,
                },
            }, { timeout: 5000 });
            aiPrediction = aiRes.data;
        } catch (aiErr) {
            console.warn(`AI service unavailable at ${env.AI_SERVICE_URL}, using local fallback:`, aiErr.message);
        }

        // Pass the resolved human-readable city name to formatter
        const response = formatAQIResponse(displayCity, pollutants, weather, aiPrediction, coordinates);
        // Also add country to response
        response.country = country || null;

        cache.set(cacheKey, response);
        res.json(response);

    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/aqi/search?q=:query
 * Location autocomplete using Nominatim.
 */
async function searchLocations(req, res, next) {
    try {
        const query = req.query.q?.trim();
        if (!query || query.length < 2) {
            return res.json([]);
        }

        const cacheKey = `search_${query.toLowerCase()}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);

        const results = await searchService.searchLocations(query);

        cache.set(cacheKey, results, 120); // 2 min TTL for search results
        res.json(results);

    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/aqi/compare?city1=:city1&city2=:city2
 * Compare AQI between two cities.
 */
async function compareCities(req, res, next) {
    try {
        const { city1, city2 } = req.query;
        if (!city1 || !city2) {
            return res.status(400).json({ error: 'Both city1 and city2 are required.' });
        }

        const cacheKey = `compare_${city1.toLowerCase()}_${city2.toLowerCase()}`;
        const cached = cache.get(cacheKey);
        if (cached) return res.json(cached);

        const result = await compareService.compareCities(city1.trim(), city2.trim());

        cache.set(cacheKey, result);
        res.json(result);

    } catch (err) {
        next(err);
    }
}

module.exports = { getAQIPrediction, searchLocations, compareCities };
