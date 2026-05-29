import api from './config';

const API_BASE = '/aqi';

export async function fetchAQIData(city) {
    const res = await api.get(`${API_BASE}/${encodeURIComponent(city)}/predict`);
    return res.data;
}

export async function searchLocations(query) {
    const res = await api.get(`${API_BASE}/search`, { params: { q: query } });
    return res.data;
}

export async function compareCities(city1, city2) {
    const res = await api.get(`${API_BASE}/compare`, { params: { city1, city2 } });
    return res.data;
}
