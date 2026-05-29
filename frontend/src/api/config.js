import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'https://clearsky-ai.onrender.com';
const cleanBaseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl.slice(0, -4) : rawBaseUrl;

const api = axios.create({
    baseURL: cleanBaseUrl,
    timeout: 45000, // 45 seconds to support Render free-tier wake-up
});

export default api;
