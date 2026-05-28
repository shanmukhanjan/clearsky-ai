/**
 * Health Recommendation Engine
 * Provides health advice based on CPCB India NAQI categories
 */

function getHealthRecommendation(category) {
    switch (category) {
        case 'Good':
            return {
                level: 'Good',
                recommendation: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
                action: 'Enjoy your normal outdoor activities.'
            };
        case 'Satisfactory':
            return {
                level: 'Satisfactory',
                recommendation: 'Air quality is acceptable. Minor breathing discomfort to sensitive people.',
                action: 'Unusually sensitive people should consider reducing prolonged or heavy exertion.'
            };
        case 'Moderate':
            return {
                level: 'Moderate',
                recommendation: 'Breathing discomfort to the people with lungs, asthma and heart diseases.',
                action: 'Active children and adults, and people with respiratory disease, such as asthma, should limit prolonged outdoor exertion.'
            };
        case 'Poor':
            return {
                level: 'Poor',
                recommendation: 'Breathing discomfort to most people on prolonged exposure.',
                action: 'Everyone should reduce prolonged or heavy exertion. Mask usage recommended.'
            };
        case 'Very Poor':
            return {
                level: 'Very Poor',
                recommendation: 'Respiratory illness on prolonged exposure. May affect healthy people.',
                action: 'Avoid prolonged outdoor activities. Use N95 masks when outside.'
            };
        case 'Severe':
            return {
                level: 'Severe',
                recommendation: 'Health warning of emergency conditions. The entire population is more likely to be affected.',
                action: 'Stay indoors and keep activity levels low. Use air purifiers.'
            };
        default:
            return {
                level: 'Unknown',
                recommendation: 'Data unavailable',
                action: 'No specific guidance'
            };
    }
}

module.exports = { getHealthRecommendation };
