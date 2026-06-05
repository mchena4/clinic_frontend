import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL, 
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
      // Check if window is defined to ensure we're in a browser environment
        if (typeof window !== 'undefined') {
          // Get the token from localStorage
        const token = localStorage.getItem('token');
        
        // Inject into the Authorization header if it exists
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        }
        return config;
    },
    (error) => {
      // Handle request errors
        return Promise.reject(error);
    }
);