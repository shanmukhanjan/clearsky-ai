/**
 * US EPA AQI Breakpoint Tables
 * Source: https://www.airnowapi.org/aq/aqi_calculator/
 * 
 * Each entry: [C_low, C_high, I_low, I_high]
 * C = pollutant concentration
 * I = AQI index value
 */

const PM25_BREAKPOINTS = [
    { cLow: 0.0,   cHigh: 12.0,  iLow: 0,   iHigh: 50  },
    { cLow: 12.1,  cHigh: 35.4,  iLow: 51,  iHigh: 100 },
    { cLow: 35.5,  cHigh: 55.4,  iLow: 101, iHigh: 150 },
    { cLow: 55.5,  cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
    { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
];

// PM10 breakpoints in µg/m³
const PM10_BREAKPOINTS = [
    { cLow: 0,   cHigh: 54,  iLow: 0,   iHigh: 50  },
    { cLow: 55,  cHigh: 154, iLow: 51,  iHigh: 100 },
    { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
    { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
    { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
    { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
    { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 },
];

// O3 (Ozone) breakpoints in ppb — 8-hour average
// OpenWeather provides µg/m³, conversion: ppb = µg/m³ / 1.9957
const O3_BREAKPOINTS = [
    { cLow: 0,    cHigh: 54.9, iLow: 0,   iHigh: 50  },
    { cLow: 55,   cHigh: 70.9, iLow: 51,  iHigh: 100 },
    { cLow: 71,   cHigh: 85.9, iLow: 101, iHigh: 150 },
    { cLow: 86,   cHigh: 105,  iLow: 151, iHigh: 200 },
    { cLow: 105.1,cHigh: 200,  iLow: 201, iHigh: 300 },
];

// CO breakpoints in ppm — 8-hour average
// OpenWeather provides µg/m³, conversion: ppm = µg/m³ / 1145
const CO_BREAKPOINTS = [
    { cLow: 0.0,  cHigh: 4.4,  iLow: 0,   iHigh: 50  },
    { cLow: 4.5,  cHigh: 9.4,  iLow: 51,  iHigh: 100 },
    { cLow: 9.5,  cHigh: 12.4, iLow: 101, iHigh: 150 },
    { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
    { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
    { cLow: 30.5, cHigh: 40.4, iLow: 301, iHigh: 400 },
    { cLow: 40.5, cHigh: 50.4, iLow: 401, iHigh: 500 },
];

// SO2 breakpoints in ppb — 1-hour average
// OpenWeather provides µg/m³, conversion: ppb = µg/m³ / 2.6196
const SO2_BREAKPOINTS = [
    { cLow: 0,   cHigh: 35,  iLow: 0,   iHigh: 50  },
    { cLow: 36,  cHigh: 75,  iLow: 51,  iHigh: 100 },
    { cLow: 76,  cHigh: 185, iLow: 101, iHigh: 150 },
    { cLow: 186, cHigh: 304, iLow: 151, iHigh: 200 },
    { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
    { cLow: 605, cHigh: 804, iLow: 301, iHigh: 400 },
    { cLow: 805, cHigh: 1004,iLow: 401, iHigh: 500 },
];

// NO2 breakpoints in ppb — 1-hour average
// OpenWeather provides µg/m³, conversion: ppb = µg/m³ / 1.8816
const NO2_BREAKPOINTS = [
    { cLow: 0,   cHigh: 53,  iLow: 0,   iHigh: 50  },
    { cLow: 54,  cHigh: 100, iLow: 51,  iHigh: 100 },
    { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
    { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
    { cLow: 650, cHigh: 1249,iLow: 201, iHigh: 300 },
    { cLow: 1250,cHigh: 1649,iLow: 301, iHigh: 400 },
    { cLow: 1650,cHigh: 2049,iLow: 401, iHigh: 500 },
];

// AQI Category definitions
const AQI_CATEGORIES = [
    { min: 0,   max: 50,  label: 'Good',                          color: '#00E400', textColor: '#155724', bg: '#d4edda' },
    { min: 51,  max: 100, label: 'Moderate',                      color: '#FFFF00', textColor: '#856404', bg: '#fff3cd' },
    { min: 101, max: 150, label: 'Unhealthy for Sensitive Groups', color: '#FF7E00', textColor: '#7d3100', bg: '#ffe0b2' },
    { min: 151, max: 200, label: 'Unhealthy',                     color: '#FF0000', textColor: '#7b0000', bg: '#ffcdd2' },
    { min: 201, max: 300, label: 'Very Unhealthy',                color: '#8F3F97', textColor: '#4a007a', bg: '#e8d5eb' },
    { min: 301, max: 500, label: 'Hazardous',                     color: '#7E0023', textColor: '#fff',    bg: '#7E0023' },
];

// Unit conversion factors from µg/m³ to pollutant-specific standard units
const CONVERSIONS = {
    o3_to_ppb:  (ugm3) => ugm3 / 1.9957,
    co_to_ppm:  (ugm3) => ugm3 / 1145,
    so2_to_ppb: (ugm3) => ugm3 / 2.6196,
    no2_to_ppb: (ugm3) => ugm3 / 1.8816,
};

module.exports = {
    PM25_BREAKPOINTS,
    PM10_BREAKPOINTS,
    O3_BREAKPOINTS,
    CO_BREAKPOINTS,
    SO2_BREAKPOINTS,
    NO2_BREAKPOINTS,
    AQI_CATEGORIES,
    CONVERSIONS,
};
