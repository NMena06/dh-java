import { request } from './api.js';

// ---- Categorias (#12, #20, #21)
export const getCategories = () => request('/api/categories');

export const createCategory = (category) =>
  request('/api/categories', { method: 'POST', body: JSON.stringify(category) });

export const deleteCategory = (id) => request(`/api/categories/${id}`, { method: 'DELETE' });

// ---- Caracteristicas (#17, #18)
export const getFeatures = () => request('/api/features');

export const createFeature = (feature) =>
  request('/api/features', { method: 'POST', body: JSON.stringify(feature) });

export const updateFeature = (id, feature) =>
  request(`/api/features/${id}`, { method: 'PUT', body: JSON.stringify(feature) });

export const deleteFeature = (id) => request(`/api/features/${id}`, { method: 'DELETE' });
