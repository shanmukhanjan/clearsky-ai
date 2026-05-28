/**
 * Search Service — Location Autocomplete via OpenWeather Geo API
 * 
 * Provides highly accurate global city search suggestions.
 */

const axios = require('axios');
const env = require('../config/env');

/**
 * Search for locations matching a query string.
 * Returns suggestions with city, state, country, lat, lon.
 */
async function searchLocations(query) {
    if (!query || query.trim().length < 2) return [];

    if (!env.OPENWEATHER_API_KEY) {
        throw new Error("OPENWEATHER_API_KEY is missing in env variables.");
    }

    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query.trim())}&limit=5&appid=${env.OPENWEATHER_API_KEY}`;
    
    try {
        const res = await axios.get(url, { timeout: 8000 });
        
        const results = res.data.map(item => ({
            displayName: `${item.name}${item.state ? ', ' + item.state : ''}, ${item.country}`,
            city: item.name,
            state: item.state || null,
            country: item.country,
            countryCode: item.country,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
        }));

        // Deduplicate
        const seen = new Set();
        const deduped = [];
        for (const item of results) {
            const key = `${item.city}|${item.country}|${item.state || ''}`;
            if (!seen.has(key)) {
                seen.add(key);
                deduped.push(item);
            }
        }

        return deduped;
    } catch (error) {
        console.error("Search API Error:", error.message);
        return [];
    }
}

/**
 * Reverse geocode coordinates to a city name using OpenWeather Geo API.
 */
async function reverseGeocode(lat, lon) {
    if (!env.OPENWEATHER_API_KEY) {
        throw new Error("OPENWEATHER_API_KEY is missing in env variables.");
    }

    const url = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${env.OPENWEATHER_API_KEY}`;
    
    try {
        const res = await axios.get(url, { timeout: 5000 });
        const data = res.data[0];
        
        if (!data) {
            return { city: 'Unknown Location', state: null, country: null, lat, lon };
        }

        return {
            city: data.name,
            state: data.state || null,
            country: data.country || null,
            lat: parseFloat(data.lat),
            lon: parseFloat(data.lon),
        };
    } catch (error) {
        console.error("Reverse Geocode Error:", error.message);
        return { city: 'Unknown Location', state: null, country: null, lat, lon };
    }
}

module.exports = { searchLocations, reverseGeocode };
