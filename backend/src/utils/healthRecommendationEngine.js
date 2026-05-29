/**
 * Health Recommendation Engine
 * Maps AQI category labels to actionable public health guidance.
 * Based on US EPA and WHO recommendations.
 */

const RECOMMENDATIONS = {
    'Good': {
        general: 'Air quality is satisfactory. Outdoor activities are safe for everyone.',
        sensitive: 'No special precautions needed.',
        outdoor: 'Ideal conditions for outdoor exercise.',
        indoor: 'Natural ventilation is fine. No air purifier needed.',
        mask: false,
        icon: '✅',
    },
    'Moderate': {
        general: 'Air quality is acceptable. Unusually sensitive individuals may experience minor symptoms.',
        sensitive: 'Unusually sensitive people should consider reducing prolonged outdoor exertion.',
        outdoor: 'Most people can continue outdoor activities normally.',
        indoor: 'Good ventilation recommended. Air purifier optional.',
        mask: false,
        icon: '🟡',
    },
    'Unhealthy for Sensitive Groups': {
        general: 'Members of sensitive groups may experience health effects.',
        sensitive: 'People with respiratory or heart conditions, children, and elderly should limit prolonged outdoor exertion.',
        outdoor: 'General public can still be outdoors. Reduce intensity of prolonged activity.',
        indoor: 'Keep indoor air clean. Consider air purifier if sensitive.',
        mask: false,
        icon: '🟠',
    },
    'Unhealthy': {
        general: 'Everyone may begin to experience health effects. Sensitive groups are at higher risk.',
        sensitive: 'Avoid prolonged outdoor exertion. Stay indoors if possible.',
        outdoor: 'Wear an N95/KN95 mask outdoors. Limit time outside.',
        indoor: 'Keep windows closed. Run HEPA air purifier.',
        mask: true,
        icon: '🔴',
    },
    'Very Unhealthy': {
        general: 'Health alert: everyone may experience serious health effects.',
        sensitive: 'Remain indoors. Avoid all outdoor physical activity.',
        outdoor: 'Wear N95 mask if you must go outside. Minimize time outdoors.',
        indoor: 'Seal gaps in windows and doors. Use air purifier continuously.',
        mask: true,
        icon: '🟣',
    },
    'Hazardous': {
        general: 'Emergency conditions. Entire population is likely to be affected.',
        sensitive: 'Stay indoors. Seek medical advice if experiencing symptoms.',
        outdoor: 'Do not go outside. If unavoidable, use full respiratory protection.',
        indoor: 'Create a clean air shelter. Run air purifier at highest setting.',
        mask: true,
        icon: '🟤',
    },
};

function getHealthRecommendation(categoryLabel) {
    return RECOMMENDATIONS[categoryLabel] || RECOMMENDATIONS['Moderate'];
}

module.exports = { getHealthRecommendation };
