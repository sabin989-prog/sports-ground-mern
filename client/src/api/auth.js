import { api, ApiError } from './client.js';

export async function me() {
  try {
    return (await api('/auth/me')).user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null; // not logged in
    throw err;
  }
}

export const login = async (body) => (await api('/auth/login', { method: 'POST', body })).user;
export const register = async (body) => (await api('/auth/register', { method: 'POST', body })).user;
export const logout = () => api('/auth/logout', { method: 'POST' });