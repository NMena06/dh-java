import { request } from './api.js';

/** Historias #30 a #33 */
export const createReservation = (data) =>
  request('/api/reservations', { method: 'POST', body: JSON.stringify(data) });

export const getMyReservations = () => request('/api/reservations/me');

export const getReservation = (id) => request(`/api/reservations/${id}`);
