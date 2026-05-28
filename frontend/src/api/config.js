import axios from 'axios';

// Detect environment automatically
const isProd = import.meta.env.PROD;

// In production, force the HTTPS Render URL if VITE_API_URL isn't set.
let rawBaseURL = import.meta.env.VITE_API_URL || (isProd ? 'https://clearsky-backend.onrender.com' : 'http://localhost:5001');

// Clean up user-provided URL to prevent double /api/api
// (If user enters https://backend.com/api or https://backend.com/)
if (rawBaseURL.endsWith('/')) {
    rawBaseURL = rawBaseURL.slice(0, -1);
}
if (rawBaseURL.endsWith('/api')) {
    rawBaseURL = rawBaseURL.slice(0, -4);
}

export const baseURL = rawBaseURL;

const api = axios.create({
    baseURL,
    timeout: 60000, // 60 seconds to allow Render free-tier cold starts
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Health check / wake-up function
export const wakeBackend = async () => {
    try {
        const res = await axios.get(`${baseURL}/health`, { timeout: 10000 });
        return res.data?.status === 'ok';
    } catch (err) {
        return false;
    }
};

// Advanced Interceptor for Render cold starts and Retries
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        
        let errorMessage = 'Network Error: Unable to reach the backend server.';
        
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            errorMessage = 'Backend is waking up from sleep. This can take up to 50 seconds on the free tier. Please retry.';
        } else if (error.response) {
            errorMessage = error.response.data?.error || `Server Error: ${error.response.status}`;
        }
        
        error.customMessage = errorMessage;

        if (!config || !config.retry) {
            config.retry = 0;
        }

        const maxRetries = 3;
        // Retry on network errors or 5xx server errors
        const shouldRetry = !error.response || (error.response.status >= 500 && error.response.status <= 599);

        if (shouldRetry && config.retry < maxRetries) {
            config.retry += 1;
            console.log(`[API] Retrying request... Attempt ${config.retry}`);
            
            // Exponential backoff: 2s, 4s, 8s (to wait for Render wakeup)
            const delayTime = Math.pow(2, config.retry) * 1000;
            await new Promise(resolve => setTimeout(resolve, delayTime));
            
            return api(config);
        }

        return Promise.reject(error);
    }
);

export default api;