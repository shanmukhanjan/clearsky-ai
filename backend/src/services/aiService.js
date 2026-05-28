const axios = require('axios');
const env = require('../config/env');

async function getPrediction(currentAQI, features) {
    try {
        const response = await axios.post(`${env.AI_SERVICE_URL}/predict`, {
            currentAQI,
            features
        }, { timeout: 8000 });
        return response.data;
    } catch (error) {
        console.error('AI Service Error:', error.message);
        // Fallback simple prediction if AI service is unreachable
        return {
            next6Hours: Math.floor(currentAQI * 1.05),
            next12Hours: Math.floor(currentAQI * 1.1),
            next24Hours: Math.floor(currentAQI * 1.15),
            smogRisk: currentAQI > 150 ? "High" : "Low",
            confidence: 60
        };
    }
}

module.exports = { getPrediction };
