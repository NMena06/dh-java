import { request } from './api.js';

/** Historia #22: busqueda por texto y fechas (YYYY-MM-DD). */
export const searchProducts = ({ q = '', checkIn = '', checkOut = '', page = 0, size = 10 } = {}) => {
  const params = new URLSearchParams({ page, size });
  if (q.trim()) params.set('q', q.trim());
  if (checkIn && checkOut) {
    params.set('checkIn', checkIn);
    params.set('checkOut', checkOut);
  }
  return request(`/api/products/search?${params}`);
};

export const getSuggestions = (q) => request(`/api/products/suggestions?q=${encodeURIComponent(q)}`);

/** Historia #23 */
export const getAvailability = (productId, from, to) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return request(`/api/products/${productId}/availability?${params}`);
};

/** Historia #28 */
export const getReviews = (productId) => request(`/api/products/${productId}/reviews`);
export const getReviewEligibility = (productId) => request(`/api/products/${productId}/reviews/eligibility`);
export const rateProduct = (productId, rating, comment) =>
  request(`/api/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify({ rating, comment }) });

/** Historias #24 y #25 */
export const getFavorites = () => request('/api/favorites');
export const addFavorite = (productId) => request(`/api/favorites/${productId}`, { method: 'PUT' });
export const removeFavorite = (productId) => request(`/api/favorites/${productId}`, { method: 'DELETE' });
