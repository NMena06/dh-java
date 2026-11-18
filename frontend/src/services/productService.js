import { request } from './api.js';

const BASE_URL = '/api/products';

export const getProducts = () => request(BASE_URL);

/** Paginado; categoryIds (array) filtra por una o varias categorias. */
export const getProductsPage = (page = 0, size = 10, categoryIds = []) => {
  const params = new URLSearchParams({ page, size });
  if (categoryIds.length > 0) params.set('categoryIds', categoryIds.join(','));
  return request(`${BASE_URL}/page?${params}`);
};

export const getRandomProducts = (limit = 10) => request(`${BASE_URL}/random?limit=${limit}`);

export const getProductById = (id) => request(`${BASE_URL}/${id}`);

export const createProduct = (product) =>
  request(BASE_URL, { method: 'POST', body: JSON.stringify(product) });

export const updateProduct = (id, product) =>
  request(`${BASE_URL}/${id}`, { method: 'PUT', body: JSON.stringify(product) });

export const assignProductCategory = (id, categoryId) =>
  request(`${BASE_URL}/${id}/category`, { method: 'PATCH', body: JSON.stringify({ categoryId }) });

export const deleteProduct = (id) => request(`${BASE_URL}/${id}`, { method: 'DELETE' });
