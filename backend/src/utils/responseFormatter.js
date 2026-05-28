const { calculateAQI } = require('./aqiCalculator');
const { assessSmogRisk } = require('./smogRiskEngine');
const { generateForecast } = require('./predictionEngine');
const { getHealthRecommendation } = require('./healthRecommendationEngine');

function formatAQIResponse(city, rawPollutants, weatherData, aiPrediction = null, coordinates = null) {
    // Step 1: Compute EPA AQI from actual pollutant concentrations
    const aqiResult = calculateAQI(rawPollutants);

    if (!aqiResult) {
        throw new Error('Unable to compute AQI from provided pollutant data.');
    }

    // Step 2: Smog risk based on PM2.5, wind, humidity
    const { smogRisk, smogScore, smogFactors } = assessSmogRisk(rawPollutants, weatherData);

    // Step 3: Use AI prediction if available, otherwise fall back to local engine
    let prediction;
    if (aiPrediction) {
        // Prevent unrealistic AQI spikes (stabilize forecast)
        const clamp = (val, prev) => {
            if (val == null || prev == null) return val;
            const maxDelta = prev * 0.25 + 15; // Max 25% + 15 AQI points shift per period
            if (val > prev + maxDelta) return Math.round(prev + maxDelta);
            if (val < prev - maxDelta) return Math.round(prev - maxDelta);
            return Math.round(val);
        };

        const p6 = clamp(aiPrediction.next6Hours, aqiResult.aqi);
        const p12 = clamp(aiPrediction.next12Hours, p6);
        const p24 = clamp(aiPrediction.next24Hours, p12);
        const p48 = clamp(aiPrediction.next48Hours, p24);
        const p72 = clamp(aiPrediction.next72Hours, p48);

        prediction = {
            next6Hours:  p6,
            next12Hours: p12,
            next24Hours: p24,
            next48Hours: p48 ?? null,
            next72Hours: p72 ?? null,
            trend:       aiPrediction.trend,
            confidence:  aiPrediction.confidence,
            model:       aiPrediction.model || 'xgboost',
            categories:  aiPrediction.categories || {},
        };
    } else {
        const forecast = generateForecast(aqiResult.aqi, weatherData);
        prediction = {
            next6Hours:  forecast.next6Hours,
            next12Hours: forecast.next12Hours,
            next24Hours: forecast.next24Hours,
            next48Hours: null,
            next72Hours: null,
            trend:       forecast.trend,
            confidence:  forecast.confidence,
            model:       'heuristic',
            categories:  forecast.categories,
        };
    }

    // Step 4: Health guidance
    const health = getHealthRecommendation(aqiResult.category);

    // Use AI smog assessment if available, otherwise use local engine
    const smogData = aiPrediction ? {
        risk: aiPrediction.smogRisk || smogRisk,
        score: aiPrediction.smogScore ?? smogScore,
        factors: aiPrediction.smogFactors || smogFactors,
    } : {
        risk: smogRisk,
        score: smogScore,
        factors: smogFactors,
    };

    return {
        city,
        timestamp: new Date().toISOString(),
        currentAQI: aqiResult.aqi,
        category: aqiResult.category,
        color: aqiResult.color,
        dominantPollutant: aqiResult.dominantPollutant,
        coordinates: coordinates || null,
        pollutants: {
            pm25: rawPollutants.pm25 != null ? parseFloat(rawPollutants.pm25.toFixed(2)) : null,
            pm10: rawPollutants.pm10 != null ? parseFloat(rawPollutants.pm10.toFixed(2)) : null,
            co:   rawPollutants.co   != null ? parseFloat(rawPollutants.co.toFixed(2))   : null,
            no2:  rawPollutants.no2  != null ? parseFloat(rawPollutants.no2.toFixed(2))  : null,
            so2:  rawPollutants.so2  != null ? parseFloat(rawPollutants.so2.toFixed(2))  : null,
            o3:   rawPollutants.o3   != null ? parseFloat(rawPollutants.o3.toFixed(2))   : null,
        },
        subIndices: aqiResult.subIndices,
        weather: {
            temperature: weatherData.temperature,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed,
            windDirection: weatherData.windDirection || null,
            pressure: weatherData.pressure || null,
        },
        smog: smogData,
        prediction,
        health,
    };
}

module.exports = { formatAQIResponse };
