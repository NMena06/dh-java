import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { getProductsPage, getRandomProducts } from '../services/productService.js';

const CATEGORIES = [
  { name: 'Hoteles', description: 'Alojamientos para tu estadia' },
  { name: 'Vuelos', description: 'Viaja a cualquier destino' },
  { name: 'Alquileres de moda', description: 'Vestidos y accesorios' },
  { name: 'Autos', description: 'Alquila el auto que necesites' },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pageData, setPageData] = useState({ content: [], page: 0, totalPages: 0, totalElements: 0 });
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    getRandomProducts(10)
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getProductsPage(pageData.page, 10)
      .then((data) => setPageData(data))
      .catch((err) => setPageError(err.message));
  }, [pageData.page]);

  const changePage = (newPage) => {
    setPageData((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="home">
      <section className="home-search">
        <h1>Encuentra tu próxima reserva</h1>
        <form className="search-form" onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder="¿A dónde vamos?" aria-label="Destino" />
          <input type="text" placeholder="Fechas de entrada - salida" aria-label="Fechas" />
          <button type="submit" className="btn btn-primary">Buscar</button>
        </form>
      </section>

      <section className="home-section">
        <h2>Buscar por categoría</h2>
        <div className="category-grid">
          {CATEGORIES.map((category) => (
            <div key={category.name} className="category-card">
              <h3>{category.name}</h3>
              <p>{category.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2>Recomendaciones</h2>
        {loading && <p>Cargando productos...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && products.length === 0 && <p>Aún no hay productos disponibles.</p>}
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2>Todos los productos</h2>
        {pageError && <p className="error-text">{pageError}</p>}
        <div className="product-grid">
          {pageData.content.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <Pagination page={pageData.page} totalPages={pageData.totalPages} onChange={changePage} />
      </section>
    </div>
  );
}
