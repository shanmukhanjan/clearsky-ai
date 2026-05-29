/**
 * Search Service — Location Autocomplete via Nominatim
 * 
 * Provides city search suggestions using OpenStreetMap Nominatim API (free, no key).
 */

const axios = require('axios');

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/**
 * Search for locations matching a query string.
 * Returns up to 5 suggestions with city, state, country, lat, lon.
 */
async function searchLocations(query) {
    if (!query || query.trim().length < 2) return [];

    const url = `${NOMINATIM_BASE}/search`;
    const res = await axios.get(url, {
        params: {
            q: query.trim(),
            format: 'json',
            limit: 10,
            addressdetails: 1,
            'accept-language': 'en',
            featuretype: 'settlement',
        },
        headers: { 'User-Agent': 'ClearSkyAI/2.0 (clearsky@example.com)' },
        timeout: 8000,
    });

    const seen = new Set();
    const results = [];

    for (const item of res.data) {
        const addr = item.address || {};
        const cityName = addr.city || addr.town || addr.village || addr.suburb
            || addr.county || addr.municipality || addr.district
            || addr.state || item.name || query;
        const country = addr.country || '';
        const state = addr.state || null;

        // Build a dedup key from city + country
        const dedupKey = `${cityName.toLowerCase()}|${country.toLowerCase()}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        results.push({
            displayName: item.display_name,
            city: cityName,
            state,
            country: country || null,
            countryCode: addr.country_code || null,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
        });

        if (results.length >= 6) break;
    }

    return results;
}

/**
 * Reverse geocode coordinates to a city name.
 */
async function reverseGeocode(lat, lon) {
    const url = `${NOMINATIM_BASE}/reverse`;
    const res = await axios.get(url, {
        params: { lat, lon, format: 'json', 'accept-language': 'en' },
        headers: { 'User-Agent': 'ClearSkyAI/2.0' },
        timeout: 5000,
    });
    const addr = res.data?.address || {};
    return {
        city: addr.city || addr.town || addr.village || addr.county || 'Unknown',
        state: addr.state || null,
        country: addr.country || null,
        lat: parseFloat(res.data.lat),
        lon: parseFloat(res.data.lon),
    };
}

module.exports = { searchLocations, reverseGeocode };
