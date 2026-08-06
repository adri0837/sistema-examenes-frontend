import axios, { isAxiosError } from 'axios';

export const obtenerMensajeError = (e: unknown, fallback: string): string => {
    if (isAxiosError(e)) {
        const mensaje = (e.response?.data as { message?: string } | undefined)?.message;
        if (mensaje) return mensaje;
    }
    return fallback;
};

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            if (window.location.pathname !== '/login' && window.location.pathname !== '/registro') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;