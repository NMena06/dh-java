import { request } from './api.js';

export const register = (data) =>
  request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });

export const login = (email, password) =>
  request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const logout = () => request('/api/auth/logout', { method: 'POST' });

export const getMe = () => request('/api/auth/me');

export const resendConfirmation = (email) =>
  request('/api/auth/resend-confirmation', { method: 'POST', body: JSON.stringify({ email }) });

// ---- Usuarios (#16, solo administradores)
export const getUsers = () => request('/api/users');

export const changeUserRole = (id, role) =>
  request(`/api/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
