/**
 * Maps an AQI value to its color hex code.
 * Matches CPCB India NAQI standard color palette.
 */
export function getAQIColor(aqi) {
    if (aqi <= 50)  return '#00B050';
    if (aqi <= 100) return '#92D050';
    if (aqi <= 200) return '#FFFF00';
    if (aqi <= 300) return '#FF9900';
    if (aqi <= 400) return '#FF0000';
    return '#C00000';
}

export function getAQITextColor(aqi) {
    if (aqi <= 50)  return '#ffffff';
    if (aqi <= 100) return '#000000';
    if (aqi <= 200) return '#000000';
    if (aqi <= 300) return '#000000';
    if (aqi <= 400) return '#ffffff';
    return '#ffffff';
}

export function getCategoryLabel(aqi) {
    if (aqi <= 50)  return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
}

export function formatPollutant(value, decimals = 1) {
    if (value == null || isNaN(value)) return 'N/A';
    return Number(value).toFixed(decimals);
}
