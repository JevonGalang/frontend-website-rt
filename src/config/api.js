export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://172.20.32.85:3333'
).replace(/\/+$/, '');

export const API_BASE = API_BASE_URL;

