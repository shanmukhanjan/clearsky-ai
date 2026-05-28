import api from './config';

const API_BASE = '/api/aqi';

/**
 * Fetch AQI Data
 */
export async function fetchAQIData(city) {

    if (!city) {
        throw new Error('City is required');
    }

    try {

        // IMPORTANT:
        // encode coordinates properly
        const encodedCity =
            encodeURIComponent(city.trim());

        const response = await api.get(
            `${API_BASE}/${encodedCity}/predict`
        );

        return response.data;

    } catch (error) {

        console.error('AQI API ERROR:', error);

        throw error;
    }
}

/**
 * Search Locations
 */
export async function searchLocations(query) {

    if (!query || query.trim().length < 2) {
        return [];
    }

    try {

        const response = await api.get(
            `${API_BASE}/search`,
            {
                params: {
                    q: query.trim(),
                },
            }
        );

        return response.data;

    } catch (error) {

        console.error(error);

        return [];
    }
}

/**
 * Compare Cities
 */
export async function compareCities(city1, city2) {

    try {

        const response = await api.get(
            `${API_BASE}/compare`,
            {
                params: {
                    city1,
                    city2,
                },
            }
        );

        return response.data;

    } catch (error) {

        console.error(error);

        throw error;
    }
}