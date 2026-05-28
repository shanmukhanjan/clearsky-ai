/**
 * CPCB India NAQI Calculator
 * Implements:
 * AQI = ((I_high - I_low) / (BP_high - BP_low)) × (C - BP_low) + I_low
 *
 * FINAL AQI = MAX of pollutant sub-indices
 */

const {
    PM25_BREAKPOINTS,
    PM10_BREAKPOINTS,
    CO_BREAKPOINTS,
    SO2_BREAKPOINTS,
    NO2_BREAKPOINTS,
    O3_BREAKPOINTS,
    NH3_BREAKPOINTS,
    AQI_CATEGORIES,
    CONVERSIONS,
} = require('./pollutantBreakpoints');

/**
 * Linear interpolation formula
 */
function interpolateAQI(concentration, breakpoints) {

    if (
        concentration == null ||
        isNaN(concentration) ||
        concentration < 0
    ) {
        return null;
    }

    for (const bp of breakpoints) {

        if (
            concentration >= bp.cLow &&
            concentration <= bp.cHigh
        ) {

            const aqi =
                ((bp.iHigh - bp.iLow) /
                (bp.cHigh - bp.cLow)) *
                (concentration - bp.cLow) +
                bp.iLow;

            return Math.round(aqi);
        }
    }

    // Above max breakpoint
    const maxAqiBp = breakpoints[breakpoints.length - 1];
    
    // Extrapolate beyond 500 if necessary, but NAQI is usually capped at 500.
    // However, it's safer to return a cap or an extrapolated value. Let's cap at 500.
    const aqi =
                ((maxAqiBp.iHigh - maxAqiBp.iLow) /
                (maxAqiBp.cHigh - maxAqiBp.cLow)) *
                (concentration - maxAqiBp.cLow) +
                maxAqiBp.iLow;
    
    return Math.max(500, Math.round(aqi));
}

/**
 * Compute AQI subindices
 * Assuming input pollutants are in µg/m³
 */
function computeSubIndices(pollutants) {

    const {
        pm25,
        pm10,
        co, // µg/m³
        so2, // µg/m³
        no2, // µg/m³
        o3, // µg/m³
        nh3, // µg/m³
    } = pollutants;

    // CO is measured in mg/m³ for NAQI
    const co_mg =
        co != null
            ? CONVERSIONS.co_ug_to_mg(co)
            : null;

    return {
        pm25: interpolateAQI(pm25, PM25_BREAKPOINTS),
        pm10: interpolateAQI(pm10, PM10_BREAKPOINTS),
        o3: interpolateAQI(o3, O3_BREAKPOINTS),
        co: interpolateAQI(co_mg, CO_BREAKPOINTS),
        so2: interpolateAQI(so2, SO2_BREAKPOINTS),
        no2: interpolateAQI(no2, NO2_BREAKPOINTS),
        nh3: interpolateAQI(nh3, NH3_BREAKPOINTS),
    };
}

/**
 * Find dominant pollutant
 */
function getDominantPollutant(subIndices) {

    let dominant = null;
    let maxAQI = -1;

    for (const [pollutant, value] of Object.entries(subIndices)) {

        if (
            value != null &&
            value > maxAQI
        ) {
            maxAQI = value;
            dominant = pollutant;
        }
    }

    return dominant;
}

/**
 * AQI category mapper
 */
function getCategory(aqi) {

    for (const cat of AQI_CATEGORIES) {

        if (
            aqi >= cat.min &&
            aqi <= cat.max
        ) {
            return cat;
        }
    }

    return AQI_CATEGORIES[
        AQI_CATEGORIES.length - 1
    ];
}

/**
 * Main AQI calculator
 */
function calculateAQI(pollutants) {

    if (!pollutants) {
        return null;
    }

    const subIndices = computeSubIndices(pollutants);

    const validValues =
        Object.values(subIndices)
            .filter(v => v != null);

    if (validValues.length === 0) {
        return null;
    }

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

module.exports = {
    calculateAQI,
    getCategory,
    computeSubIndices,
    getDominantPollutant,
};