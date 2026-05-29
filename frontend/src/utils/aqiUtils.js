/**
 * Maps an AQI value to its color hex code.
 * Matches US EPA standard color palette.
 */
export function getAQIColor(aqi) {
    if (aqi <= 50)  return '#00E400';
    if (aqi <= 100) return '#FFFF00';
    if (aqi <= 150) return '#FF7E00';
    if (aqi <= 200) return '#FF0000';
    if (aqi <= 300) return '#8F3F97';
    return '#7E0023';
}

export function getAQITextColor(aqi) {
    if (aqi <= 50)  return '#155724';
    if (aqi <= 100) return '#856404';
    if (aqi <= 150) return '#7d3100';
    if (aqi <= 200) return '#7b0000';
    if (aqi <= 300) return '#4a007a';
    return '#fff';
}

export function getCategoryLabel(aqi) {
    if (aqi <= 50)  return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
}

export function formatPollutant(value, decimals = 1) {
    if (value == null || isNaN(value)) return 'N/A';
    return Number(value).toFixed(decimals);
}
