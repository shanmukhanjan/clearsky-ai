const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const env = require('../config/env');
const searchService = require('./searchService');

// Configure axios retries
axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => retryCount * 1000,
    retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED';
    }
});
/**
 * Fetch coordinates from city name
 */
async function fetchCoordinates(city) {
    const results = await searchService.searchLocations(city);
    if (!results || results.length === 0) {
        throw new Error(`City not found: ${city}`);
    }
    const best = results[0];
    return {
        lat: best.lat,
        lon: best.lon,
        name: best.city,
        country: best.country,
    };
}

/**
 * Fetch raw pollutant concentrations from OpenWeather
 * (WAQI primarily returns indices, so we use OpenWeather for raw concentrations
 * to calculate the Indian NAQI manually)
 */
async function fetchPollutionOpenWeather(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${env.OPENWEATHER_API_KEY}`;
    try {
        const res = await axios.get(url, { timeout: 10000 });
        const item = res.data.list[0];
        const comp = item.components;
        return {
            pm25: comp.pm2_5 ?? null,
            pm10: comp.pm10 ?? null,
            co: comp.co ?? null,     // OpenWeather CO is in ug/m3
            no2: comp.no2 ?? null,
            so2: comp.so2 ?? null,
            o3: comp.o3 ?? null,
            nh3: comp.nh3 ?? null,
        };
    } catch (e) {
        console.error("OpenWeather Pollution Error:", e.message);
        return null;
    }
}

/**
 * Fetch data from primary WAQI API
 */
async function fetchWAQI(lat, lon) {
    const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${env.WAQI_API_KEY}`;
    try {
        const res = await axios.get(url, { timeout: 10000 });
        if (res.data && res.data.status === 'ok') {
            return res.data.data;
        }
    } catch (e) {
        console.error("WAQI API Error:", e.message);
    }
    return null;
}

/**
 * Fetch weather data
 */
async function fetchWeather(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${env.OPENWEATHER_API_KEY}`;
    try {
        const res = await axios.get(url, { timeout: 10000 });
        const d = res.data;
        return {
            temperature: d.main?.temp ?? null,
            humidity: d.main?.humidity ?? null,
            pressure: d.main?.pressure ?? null,
            windSpeed: d.wind?.speed ?? null,
            windDirection: d.wind?.deg ?? null,
            description: d.weather?.[0]?.description ?? '',
            icon: d.weather?.[0]?.icon ?? '',
        };
    } catch (e) {
        console.error("Weather API Error:", e.message);
        return null;
    }
}

/**
 * Main AQI fetch
 */
async function getAQIData(cityOrCoords) {
    if (!env.OPENWEATHER_API_KEY || !env.WAQI_API_KEY) {
        throw new Error('API Keys missing (WAQI or OpenWeather)');
    }

    let lat, lon, name, country;

    const coordMatch = cityOrCoords.match(/^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)$/);

    if (coordMatch) {
        lat = parseFloat(coordMatch[1]);
        lon = parseFloat(coordMatch[3]);
        const reverse = await searchService.reverseGeocode(lat, lon);
        name = reverse.city;
        country = reverse.country;
    } else {
        const coords = await fetchCoordinates(cityOrCoords);
        lat = coords.lat;
        lon = coords.lon;
        name = coords.name;
        country = coords.country;
    }

    console.log("FETCHING FOR:", name, lat, lon);

    const [owmPollutants, waqiData, weather] = await Promise.all([
        fetchPollutionOpenWeather(lat, lon),
        fetchWAQI(lat, lon),
        fetchWeather(lat, lon),
    ]);

    // We rely on OpenWeather for raw concentrations because it's guaranteed ug/m3
    // We can fallback to WAQI's iaqi if necessary, though it represents indices.
    let pollutants = owmPollutants;
    
    // Fallback if OpenWeather fails but WAQI is available
    if (!pollutants && waqiData && waqiData.iaqi) {
        pollutants = {
            pm25: waqiData.iaqi.pm25?.v ?? null,
            pm10: waqiData.iaqi.pm10?.v ?? null,
            co: waqiData.iaqi.co?.v ?? null,
            no2: waqiData.iaqi.no2?.v ?? null,
            so2: waqiData.iaqi.so2?.v ?? null,
            o3: waqiData.iaqi.o3?.v ?? null,
            nh3: null
        };
    }

    if (!pollutants) {
        throw new Error("Unable to fetch pollutant data from APIs.");
    }

    return {
        pollutants,
        currentAQI: waqiData?.aqi || null, // we'll recalculate manually anyway in the controller
        weather,
        coordinates: { lat, lon },
        resolvedName: name,
        country,
        stationName: waqiData?.city?.name || name
    };
}

module.exports = {
    getAQIData,
};
