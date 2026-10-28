const BASE_URL = '/api/products';

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    let message = 'Ocurrió un error inesperado';
    try {
      const data = await response.json();
      if (data.message) message = data.message;
    } catch {
      // respuesta sin cuerpo JSON
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const getProducts = () => request(BASE_URL);

export const getProductsPage = (page = 0, size = 10) =>
  request(`${BASE_URL}/page?page=${page}&size=${size}`);

export const getRandomProducts = (limit = 10) => request(`${BASE_URL}/random?limit=${limit}`);

export const getProductById = (id) => request(`${BASE_URL}/${id}`);

export const createProduct = (product) =>
  request(BASE_URL, { method: 'POST', body: JSON.stringify(product) });

export const deleteProduct = (id) => request(`${BASE_URL}/${id}`, { method: 'DELETE' });
