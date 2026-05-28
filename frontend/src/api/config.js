import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://clearsky-backend.onrender.com',
    timeout: 45000,
});

export default api;