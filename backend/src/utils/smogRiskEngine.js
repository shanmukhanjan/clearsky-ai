/**
 * Smog Risk Detection Engine
 *
 * Smog forms when:
 * - Fine particles (PM2.5) accumulate
 * - Low wind prevents dispersion
 * - High humidity traps pollutants near the surface
 * - Temperature inversions can be inferred from low wind + high humidity in cooler temps
 *
 * Outputs: risk level ('Low' | 'Moderate' | 'High'), score, and contributing factors.
 */

function assessSmogRisk(pollutants, weather) {
    const { pm25, o3 } = pollutants;
    const { humidity, windSpeed, temperature } = weather;

    let score = 0;
    const factors = [];

    // PM2.5 contribution — primary smog driver
    if (pm25 > 150) { score += 40; factors.push('Very high PM2.5'); }
    else if (pm25 > 75) { score += 25; factors.push('Elevated PM2.5'); }
    else if (pm25 > 35) { score += 12; factors.push('Moderate PM2.5'); }

    // Wind speed — low wind traps pollutants
    if (windSpeed < 2) { score += 30; factors.push('Near-calm wind conditions'); }
    else if (windSpeed < 5) { score += 18; factors.push('Low wind speed'); }
    else if (windSpeed < 10) { score += 6; factors.push('Reduced wind speed'); }

    // Humidity — high humidity forms haze and enhances particle growth
    if (humidity > 85) { score += 20; factors.push('Very high humidity'); }
    else if (humidity > 70) { score += 12; factors.push('High humidity'); }
    else if (humidity > 55) { score += 5; }

    // Temperature inversion proxy — cold + low wind + high humidity
    if (temperature < 10 && windSpeed < 5 && humidity > 65) {
        score += 15;
        factors.push('Possible temperature inversion conditions');
    }

    // O3 contribution — photochemical smog indicator
    if (o3 > 120) { score += 10; factors.push('Elevated ozone (photochemical smog risk)'); }

    // Map score to risk level
    let riskLevel;
    if (score >= 70)      riskLevel = 'High';
    else if (score >= 35) riskLevel = 'Moderate';
    else                  riskLevel = 'Low';

    return {
        smogRisk: riskLevel,
        smogScore: Math.min(score, 100),
        smogFactors: factors,
    };
}

module.exports = { assessSmogRisk };
