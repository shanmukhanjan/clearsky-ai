const axios = require('axios');
const env = require('../config/env');
const searchService = require('./searchService');

async function fetchCoordinates(city) {
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${env.OPENWEATHER_API_KEY}`;
    const res = await axios.get(url, { timeout: 8000 });
    if (!res.data || res.data.length === 0) throw new Error(`City not found: ${city}`);
    const { lat, lon, name, country } = res.data[0];
    return { lat, lon, name, country };
}

async function fetchPollutants(lat, lon) {
    const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${env.OPENWEATHER_API_KEY}`;
    const res = await axios.get(url, { timeout: 8000 });
    const comp = res.data.list[0].components;

    return {
        pm25: comp.pm2_5  ?? null,
        pm10: comp.pm10   ?? null,
        co:   comp.co     ?? null,
        no2:  comp.no2    ?? null,
        so2:  comp.so2    ?? null,
        o3:   comp.o3     ?? null,
    };
}

async function fetchWeather(lat, lon) {
    const url = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${env.OPENWEATHER_API_KEY}`;
    const res = await axios.get(url, { timeout: 8000 });
    const d = res.data;
    return {
        temperature: d.main?.temp       ?? null,
        humidity:    d.main?.humidity   ?? null,
        pressure:    d.main?.pressure   ?? null,
        windSpeed:   d.wind?.speed      ?? null,
        windDirection: d.wind?.deg      ?? null,
        description: d.weather?.[0]?.description ?? '',
        icon:        d.weather?.[0]?.icon ?? '',
    };
}

/**
 * Fetch 72h weather forecast from Open-Meteo (free, no key needed).
 * Returns hourly forecast data for the next 3 days.
 */
async function fetchWeatherForecast(lat, lon) {
    try {
        const url = 'https://api.open-meteo.com/v1/forecast';
        const res = await axios.get(url, {
            params: {
                latitude: lat,
                longitude: lon,
                hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,precipitation,uv_index',
                forecast_days: 3,
                timezone: 'UTC',
            },
            timeout: 10000,
        });
        const hourly = res.data?.hourly || {};
        const times = hourly.time || [];
        return times.map((t, i) => ({
            time: t,
            temperature: hourly.temperature_2m?.[i] ?? null,
            humidity: hourly.relative_humidity_2m?.[i] ?? null,
            windSpeed: hourly.wind_speed_10m?.[i] ?? null,
            pressure: hourly.surface_pressure?.[i] ?? null,
            precipitation: hourly.precipitation?.[i] ?? null,
            uvIndex: hourly.uv_index?.[i] ?? null,
        }));
    } catch (err) {
        console.warn('Open-Meteo forecast fetch failed:', err.message);
        return [];
    }
}

async function getAQIData(cityOrCoords) {
    if (!env.OPENWEATHER_API_KEY) {
        throw new Error('OPENWEATHER_API_KEY is not configured.');
    }
    
    let lat, lon, name, country;
    
    // Check if input is coordinates: "lat,lon"
    const coordMatch = cityOrCoords.match(/^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
        lat = parseFloat(coordMatch[1]);
        lon = parseFloat(coordMatch[3]);
        // Reverse geocode to get a clean city name
        try {
            const url = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${env.OPENWEATHER_API_KEY}`;
            const res = await axios.get(url, { timeout: 8000 });
            if (res.data && res.data.length > 0) {
                name = res.data[0].name;
                country = res.data[0].country;
            } else {
                throw new Error('OpenWeather reverse geocode empty');
            }
        } catch (e) {
            // Fallback to Nominatim for oceans/remote areas
            try {
                const nomRes = await searchService.reverseGeocode(lat, lon);
                name = nomRes.city || 'Global Coordinates';
                country = nomRes.country || '';
            } catch (nomErr) {
                name = 'Global Coordinates';
                country = '';
            }
        }
    } else {
        const coords = await fetchCoordinates(cityOrCoords);
        lat = coords.lat;
        lon = coords.lon;
        name = coords.name;
        country = coords.country;
    }

    const [pollutants, weather] = await Promise.all([
        fetchPollutants(lat, lon),
        fetchWeather(lat, lon),
    ]);
    return {
        pollutants,
        weather,
        coordinates: { lat, lon },
        resolvedName: name,
        country,
    };
}

module.exports = { getAQIData, fetchWeatherForecast };
