/**
 * US EPA AQI Calculator
 * Implements: AQI = ((I_high - I_low) / (BP_high - BP_low)) × (C - BP_low) + I_low
 * Final AQI = MAX of all pollutant sub-indices
 */

const {
    PM25_BREAKPOINTS,
    PM10_BREAKPOINTS,
    O3_BREAKPOINTS,
    CO_BREAKPOINTS,
    SO2_BREAKPOINTS,
    NO2_BREAKPOINTS,
    AQI_CATEGORIES,
    CONVERSIONS,
} = require('./pollutantBreakpoints');

/**
 * Core EPA linear interpolation formula.
 * Returns null if concentration is out of all breakpoint ranges.
 */
function interpolateAQI(concentration, breakpoints) {
    if (concentration == null || isNaN(concentration) || concentration < 0) return null;

    for (const bp of breakpoints) {
        if (concentration >= bp.cLow && concentration <= bp.cHigh) {
            const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (concentration - bp.cLow) + bp.iLow;
            return Math.round(aqi);
        }
    }

    // Concentration exceeds highest breakpoint — return max AQI
    return 500;
}

/**
 * Compute AQI sub-index for each pollutant from raw OpenWeather concentrations.
 * OpenWeather units:
 *   pm2_5, pm10 → µg/m³ (no conversion needed for EPA tables)
 *   o3, co, so2, no2 → µg/m³ (require unit conversion)
 */
function computeSubIndices(pollutants) {
    const { pm25, pm10, o3, co, so2, no2 } = pollutants;

    const o3_ppb  = o3  != null ? CONVERSIONS.o3_to_ppb(o3)   : null;
    const co_ppm  = co  != null ? CONVERSIONS.co_to_ppm(co)    : null;
    const so2_ppb = so2 != null ? CONVERSIONS.so2_to_ppb(so2)  : null;
    const no2_ppb = no2 != null ? CONVERSIONS.no2_to_ppb(no2)  : null;

    return {
        pm25: interpolateAQI(pm25,   PM25_BREAKPOINTS),
        pm10: interpolateAQI(pm10,   PM10_BREAKPOINTS),
        o3:   interpolateAQI(o3_ppb, O3_BREAKPOINTS),
        co:   interpolateAQI(co_ppm, CO_BREAKPOINTS),
        so2:  interpolateAQI(so2_ppb,SO2_BREAKPOINTS),
        no2:  interpolateAQI(no2_ppb,NO2_BREAKPOINTS),
    };
}

/**
 * Determines which pollutant drives the AQI (highest sub-index).
 */
function getDominantPollutant(subIndices) {
    let dominant = null;
    let maxAQI = -1;

    for (const [pollutant, value] of Object.entries(subIndices)) {
        if (value != null && value > maxAQI) {
            maxAQI = value;
            dominant = pollutant;
        }
    }

    return dominant;
}

/**
 * Returns the AQI category object for a given AQI value.
 */
function getCategory(aqi) {
    for (const cat of AQI_CATEGORIES) {
        if (aqi >= cat.min && aqi <= cat.max) return cat;
    }
    return AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
}

/**
 * Main entry point: compute final AQI from raw pollutant concentrations.
 * Returns full result including sub-indices, dominant pollutant, and category.
 */
function calculateAQI(pollutants) {
    const subIndices = computeSubIndices(pollutants);

    const validValues = Object.values(subIndices).filter(v => v != null);
    if (validValues.length === 0) return null;

    const finalAQI = Math.max(...validValues);
    const dominant = getDominantPollutant(subIndices);
    const category = getCategory(finalAQI);

    return {
        aqi: finalAQI,
        dominantPollutant: dominant,
        subIndices,
        category: category.label,
        color: category.color,
        textColor: category.textColor,
        bg: category.bg,
    };
}

module.exports = { calculateAQI, getCategory, computeSubIndices, getDominantPollutant };
