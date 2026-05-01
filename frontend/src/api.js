import axios from 'axios';

// in dev we use the proxy from package.json, in prod use env var
const baseURL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({ baseURL });

// attach token automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
});

// kick user out if token expired
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response && err.response.status === 401) {
            // dont redirect on the auth endpoints (login/signup themselves return 401)
            const url = err.config.url || '';
            if (!url.includes('/auth/login') && !url.includes('/auth/signup')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // soft redirect
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(err);
    }
);

export default api;
