/**
 * Compare Service — Side-by-Side City AQI Comparison
 * 
 * Fetches AQI data for two cities in parallel and returns
 * a combined comparison payload.
 */

const aqiService = require('./aqiService');
const { formatAQIResponse } = require('../utils/responseFormatter');

/**
 * Compare AQI between two cities.
 * Returns both city payloads side-by-side.
 */
async function compareCities(city1, city2) {
    const [data1, data2] = await Promise.all([
        fetchCityData(city1),
        fetchCityData(city2),
    ]);

    return {
        city1: data1,
        city2: data2,
        comparison: {
            aqiDifference: Math.abs(data1.currentAQI - data2.currentAQI),
            betterCity: data1.currentAQI <= data2.currentAQI ? data1.city : data2.city,
            worseCity: data1.currentAQI > data2.currentAQI ? data1.city : data2.city,
        },
    };
}

async function fetchCityData(city) {
    const { pollutants, weather, coordinates } = await aqiService.getAQIData(city);
    const response = formatAQIResponse(city, pollutants, weather);
    // Attach coordinates for map display
    if (coordinates) {
        response.coordinates = coordinates;
    }
    return response;
}

module.exports = { compareCities };
