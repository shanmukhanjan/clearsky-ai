/**
 * AQI Prediction Engine
 *
 * Generates scientifically-grounded short-term AQI forecasts (6h–72h)
 * based on current pollutant levels and meteorological conditions.
 */

const { getCategory } = require('./aqiCalculator');

function computeWeatherFactor(weather) {
    const { windSpeed = 10, humidity = 50, temperature = 20 } = weather;
    // Wind disperses pollution
    const windEffect = -0.025 * Math.min(windSpeed, 30);
    // Humidity can trap particles
    const humidityEffect = 0.003 * Math.max(0, humidity - 50);
    // Heat can increase ozone and particle formation
    const tempEffect = temperature > 25 ? 0.008 * (temperature - 25) : 0;
    
    const factor = 1.0 + windEffect + humidityEffect + tempEffect;
    return Math.max(0.75, Math.min(1.40, factor));
}

function smoothProjection(current, projected, alpha = 0.65) {
    return Math.round(alpha * projected + (1 - alpha) * current);
}

function computeConfidenceCategory(baseAQI, weatherFactor) {
    // Confidence is High if weather is stable and AQI is not extreme
    // Medium if moderate changes
    // Low if extreme weather or extreme AQI changes are expected
    const instability = Math.abs(weatherFactor - 1.0);
    
    if (instability > 0.25 || baseAQI > 300) {
        return "Low";
    } else if (instability > 0.1 || baseAQI > 150) {
        return "Medium";
    }
    return "High";
}

function generateForecast(currentAQI, weather) {
    const weatherFactor = computeWeatherFactor(weather);

    const raw6h  = currentAQI * Math.pow(weatherFactor, 0.4);
    const raw12h = currentAQI * Math.pow(weatherFactor, 0.7);
    const raw24h = currentAQI * Math.pow(weatherFactor, 1.0);
    const raw48h = currentAQI * Math.pow(weatherFactor, 1.4);
    const raw72h = currentAQI * Math.pow(weatherFactor, 1.7);

    const next6Hours  = smoothProjection(currentAQI, raw6h,  0.60);
    const next12Hours = smoothProjection(currentAQI, raw12h, 0.65);
    const next24Hours = smoothProjection(currentAQI, raw24h, 0.70);
    const next48Hours = smoothProjection(currentAQI, raw48h, 0.75);
    const next72Hours = smoothProjection(currentAQI, raw72h, 0.78);

    const clamp = v => {
        if (isNaN(v) || v < 0) return currentAQI;
        return Math.max(0, Math.min(500, Math.round(v)));
    };

    const f6  = clamp(next6Hours);
    const f12 = clamp(next12Hours);
    const f24 = clamp(next24Hours);
    const f48 = clamp(next48Hours);
    const f72 = clamp(next72Hours);

    return {
        next6Hours:  f6,
        next12Hours: f12,
        next24Hours: f24,
        next48Hours: f48,
        next72Hours: f72,
        trend: f24 > currentAQI * 1.05
            ? 'Rising'
            : f24 < currentAQI * 0.95
            ? 'Improving'
            : 'Stable',
        weatherFactor: parseFloat(weatherFactor.toFixed(3)),
        confidence: computeConfidenceCategory(currentAQI, weatherFactor),
        categories: {
            next6h:  getCategory(f6).label,
            next12h: getCategory(f12).label,
            next24h: getCategory(f24).label,
            next48h: getCategory(f48).label,
            next72h: getCategory(f72).label,
        },
    };
}

module.exports = { generateForecast, computeWeatherFactor };
