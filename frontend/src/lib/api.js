import axios from 'axios';

const api = axios.create({
    baseURL: 'https://charity-kj0m.onrender.com/api',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});


// Request interceptor to add token and start timer
api.interceptors.request.use((config) => {
    config.startTime = new Date().getTime();
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to log time
api.interceptors.response.use((response) => {
    const end = new Date().getTime();
    const duration = end - response.config.startTime;
    console.log(`%c⚡ API: ${response.config.url} — ${duration}ms`, `color: ${duration > 300 ? "#ff4757" : "#2ed573"}; font-weight: bold;`);
    return response;
}, (error) => {
    return Promise.reject(error);
});

export default api;
