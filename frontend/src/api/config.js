import axios from 'axios';

// Ensure we ALWAYS point to the backend correctly.
// If VITE_API_URL is missing, fallback to the production URL.
const baseURL = import.meta.env.VITE_API_URL || 'https://clearsky-backend.onrender.com';

const api = axios.create({
    baseURL,
    timeout: 30000, // 30 seconds max
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Interceptor for retries and error parsing
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        
        // Enhance error messages
        let errorMessage = 'Network Error: Unable to reach the backend server.';
        
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            errorMessage = 'Request Timeout: The backend is taking too long to respond (it might be waking up).';
        } else if (error.response) {
            errorMessage = error.response.data?.error || `Server Error: ${error.response.status}`;
        }
        
        // Attach detailed message
        error.customMessage = errorMessage;

        // Auto-retry logic for network errors or 5xx errors (up to 2 times)
        if (!config || !config.retry) {
            config.retry = 0;
        }

        const maxRetries = 2;
        const shouldRetry = !error.response || (error.response.status >= 500 && error.response.status <= 599);

        if (shouldRetry && config.retry < maxRetries) {
            config.retry += 1;
            console.log(`Retrying request... Attempt ${config.retry}`);
            
            // Exponential backoff (1s, 2s...)
            const delay = new Promise(resolve => setTimeout(resolve, config.retry * 1000));
            await delay;
            
            return api(config);
        }

        return Promise.reject(error);
    }
);

export default api;