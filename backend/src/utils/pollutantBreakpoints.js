/**
 * CPCB India NAQI Breakpoint Tables
 * Source: Central Pollution Control Board (CPCB), India
 * 
 * Each entry: [C_low, C_high, I_low, I_high]
 * C = pollutant concentration (µg/m³ except for CO which is mg/m³)
 * I = AQI index value
 */

// PM2.5 breakpoints in µg/m³ (24-hour average)
const PM25_BREAKPOINTS = [
    { cLow: 0.0,   cHigh: 30.0,  iLow: 0,   iHigh: 50  },
    { cLow: 30.1,  cHigh: 60.0,  iLow: 51,  iHigh: 100 },
    { cLow: 60.1,  cHigh: 90.0,  iLow: 101, iHigh: 200 },
    { cLow: 90.1,  cHigh: 120.0, iLow: 201, iHigh: 300 },
    { cLow: 120.1, cHigh: 250.0, iLow: 301, iHigh: 400 },
    { cLow: 250.1, cHigh: 500.0, iLow: 401, iHigh: 500 }, // Usually capped at 500
];

// PM10 breakpoints in µg/m³ (24-hour average)
const PM10_BREAKPOINTS = [
    { cLow: 0,   cHigh: 50,  iLow: 0,   iHigh: 50  },
    { cLow: 51,  cHigh: 100, iLow: 51,  iHigh: 100 },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 431, cHigh: 600, iLow: 401, iHigh: 500 },
];

// O3 (Ozone) breakpoints in µg/m³ (8-hour average)
const O3_BREAKPOINTS = [
    { cLow: 0,   cHigh: 50,  iLow: 0,   iHigh: 50  },
    { cLow: 51,  cHigh: 100, iLow: 51,  iHigh: 100 },
    { cLow: 101, cHigh: 168, iLow: 101, iHigh: 200 },
    { cLow: 169, cHigh: 208, iLow: 201, iHigh: 300 },
    { cLow: 209, cHigh: 748, iLow: 301, iHigh: 400 },
    { cLow: 749, cHigh: 1000,iLow: 401, iHigh: 500 },
];

// CO breakpoints in mg/m³ (8-hour average)
const CO_BREAKPOINTS = [
    { cLow: 0.0,  cHigh: 1.0,  iLow: 0,   iHigh: 50  },
    { cLow: 1.1,  cHigh: 2.0,  iLow: 51,  iHigh: 100 },
    { cLow: 2.1,  cHigh: 10.0, iLow: 101, iHigh: 200 },
    { cLow: 10.1, cHigh: 17.0, iLow: 201, iHigh: 300 },
    { cLow: 17.1, cHigh: 34.0, iLow: 301, iHigh: 400 },
    { cLow: 34.1, cHigh: 50.0, iLow: 401, iHigh: 500 },
];

// SO2 breakpoints in µg/m³ (24-hour average)
const SO2_BREAKPOINTS = [
    { cLow: 0,   cHigh: 40,  iLow: 0,   iHigh: 50  },
    { cLow: 41,  cHigh: 80,  iLow: 51,  iHigh: 100 },
    { cLow: 81,  cHigh: 380, iLow: 101, iHigh: 200 },
    { cLow: 381, cHigh: 800, iLow: 201, iHigh: 300 },
    { cLow: 801, cHigh: 1600,iLow: 301, iHigh: 400 },
    { cLow: 1601,cHigh: 2000,iLow: 401, iHigh: 500 },
];

// NO2 breakpoints in µg/m³ (24-hour average)
const NO2_BREAKPOINTS = [
    { cLow: 0,   cHigh: 40,  iLow: 0,   iHigh: 50  },
    { cLow: 41,  cHigh: 80,  iLow: 51,  iHigh: 100 },
    { cLow: 81,  cHigh: 180, iLow: 101, iHigh: 200 },
    { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300 },
    { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400 },
    { cLow: 401, cHigh: 600, iLow: 401, iHigh: 500 },
];

// NH3 breakpoints in µg/m³ (24-hour average)
const NH3_BREAKPOINTS = [
    { cLow: 0,    cHigh: 200,  iLow: 0,   iHigh: 50  },
    { cLow: 201,  cHigh: 400,  iLow: 51,  iHigh: 100 },
    { cLow: 401,  cHigh: 800,  iLow: 101, iHigh: 200 },
    { cLow: 801,  cHigh: 1200, iLow: 201, iHigh: 300 },
    { cLow: 1201, cHigh: 1800, iLow: 301, iHigh: 400 },
    { cLow: 1801, cHigh: 2500, iLow: 401, iHigh: 500 },
];

// AQI Category definitions (Indian Standard)
const AQI_CATEGORIES = [
    { min: 0,   max: 50,  label: 'Good',         color: '#00B050', textColor: '#ffffff', bg: '#00B050' },
    { min: 51,  max: 100, label: 'Satisfactory', color: '#92D050', textColor: '#000000', bg: '#92D050' },
    { min: 101, max: 200, label: 'Moderate',     color: '#FFFF00', textColor: '#000000', bg: '#FFFF00' },
    { min: 201, max: 300, label: 'Poor',         color: '#FF9900', textColor: '#000000', bg: '#FF9900' },
    { min: 301, max: 400, label: 'Very Poor',    color: '#FF0000', textColor: '#ffffff', bg: '#FF0000' },
    { min: 401, max: 500, label: 'Severe',       color: '#C00000', textColor: '#ffffff', bg: '#C00000' },
];

// Unit conversion factors
const CONVERSIONS = {
    // OpenWeather API usually returns in ug/m3. 
    // India NAQI uses ug/m3 for all except CO which is mg/m3
    co_ug_to_mg: (ugm3) => ugm3 / 1000, 
};

module.exports = {
    PM25_BREAKPOINTS,
    PM10_BREAKPOINTS,
    O3_BREAKPOINTS,
    CO_BREAKPOINTS,
    SO2_BREAKPOINTS,
    NO2_BREAKPOINTS,
    NH3_BREAKPOINTS,
    AQI_CATEGORIES,
    CONVERSIONS,
};
