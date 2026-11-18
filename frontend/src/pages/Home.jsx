import { useEffect, useRef, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { getProductsPage, getRandomProducts } from '../services/productService.js';
import { getCategories } from '../services/catalogService.js';
import { searchProducts } from '../services/searchService.js';
import SearchBar from '../components/SearchBar.jsx';
import { formatLong, fromISO } from '../utils/dates.js';

const PAGE_SIZE = 10;

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState('');
  const [selected, setSelected] = useState([]);

  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ content: [], totalPages: 0, totalElements: 0, totalProducts: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const resultsRef = useRef(null);

  // Historia #22: busqueda. null = sin busqueda activa
  const [search, setSearch] = useState(null);
  const [searchPage, setSearchPage] = useState(0);
  const [searchData, setSearchData] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    if (!search) return undefined;
    let cancelled = false;
    setSearchLoading(true);
    setSearchError('');
    searchProducts({ ...search, page: searchPage, size: PAGE_SIZE })
      .then((data) => !cancelled && setSearchData(data))
      .catch((err) => !cancelled && setSearchError(err.message))
      .finally(() => !cancelled && setSearchLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, searchPage]);

  const runSearch = (criteria) => {
    setSearch(criteria);
    setSearchPage(0);
    setTimeout(() => searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const clearSearch = () => {
    setSearch(null);
    setSearchData(null);
  };

  useEffect(() => {
    getRandomProducts(10)
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    getCategories()
      .then(setCategories)
      .catch((err) => setCategoriesError(err.message));
  }, []);

  // Historia #20: los resultados se recalculan al cambiar de pagina o de filtro
  const selectedKey = selected.join(',');
  useEffect(() => {
    let cancelled = false;
    setPageLoading(true);
    setPageError('');
    getProductsPage(page, PAGE_SIZE, selected)
      .then((data) => !cancelled && setPageData(data))
      .catch((err) => !cancelled && setPageError(err.message))
      .finally(() => !cancelled && setPageLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedKey]);

  const scrollToResults = () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const toggleCategory = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setPage(0);
  };

  const clearFilters = () => {
    setSelected([]);
    setPage(0);
  };

  const changePage = (newPage) => {
    setPage(newPage);
    scrollToResults();
  };

  const hasFilters = selected.length > 0;
  const selectedNames = categories.filter((c) => selected.includes(c.id)).map((c) => c.title);

  return (
    <div className="home">
      <SearchBar onSearch={runSearch} />

      {search && (
        <section className="home-section search-results" ref={searchRef} aria-labelledby="search-results-title" aria-busy={searchLoading}>
          <div className="results-header">
            <h2 id="search-results-title">Resultados de búsqueda</h2>
            <button type="button" className="btn btn-outline-dark btn-sm" onClick={clearSearch}>Limpiar búsqueda</button>
          </div>
          <p className="results-count" aria-live="polite">
            {searchData && (
              <>
                <strong>{searchData.totalElements}</strong> {searchData.totalElements === 1 ? 'resultado' : 'resultados'}
                {search.q && <> para <strong>“{search.q}”</strong></>}
                {search.checkIn && (
                  <> disponibles del <strong>{formatLong(fromISO(search.checkIn))}</strong> al <strong>{formatLong(fromISO(search.checkOut))}</strong></>
                )}
              </>
            )}
          </p>
          {searchError && <p className="error-text" role="alert">{searchError}</p>}
          {!searchLoading && searchData && searchData.content.length === 0 && (
            <div className="empty-results">
              <p>No encontramos productos que coincidan con tu búsqueda. Prueba con otras palabras o fechas.</p>
            </div>
          )}
          <div className={`product-grid ${searchLoading ? 'is-loading' : ''}`}>
            {searchData?.content.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {searchData && (
            <Pagination page={searchPage} totalPages={searchData.totalPages} onChange={(p) => {
              setSearchPage(p);
              searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }} />
          )}
        </section>
      )}

      <section className="home-section">
        <h2>Buscar por categoría</h2>
        {categoriesError && <p className="error-text">{categoriesError}</p>}
        <div className="category-grid">
          {categories.map((category) => {
            const active = selected.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                className={`category-card ${active ? 'active' : ''}`}
                aria-pressed={active}
                onClick={() => {
                  toggleCategory(category.id);
                  scrollToResults();
                }}
              >
                <img src={category.image} alt="" className="category-image" />
                <span className="category-body">
                  <strong>{category.title}</strong>
                  <span>{category.description}</span>
                </span>
              </button>
            );
          })}
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

      <section className="home-section results-section" ref={resultsRef} aria-labelledby="results-title">
        <h2 id="results-title">Todos los productos</h2>

        <div className="filter-bar" role="group" aria-label="Filtrar por categoría">
          <span className="filter-label">Filtrar por categoría:</span>
          <div className="filter-chips">
            {categories.map((category) => {
              const active = selected.includes(category.id);
              return (
                <label key={category.id} className={`chip ${active ? 'active' : ''}`}>
                  <input type="checkbox" checked={active} onChange={() => toggleCategory(category.id)} />
                  {category.title}
                </label>
              );
            })}
          </div>
          {hasFilters && (
            <button type="button" className="btn btn-outline-dark btn-sm clear-filters" onClick={clearFilters}>
              Limpiar filtros
            </button>
          )}
        </div>

        <p className="results-count" aria-live="polite">
          {hasFilters ? (
            <>
              Mostrando <strong>{pageData.totalElements}</strong> de <strong>{pageData.totalProducts}</strong> productos
              {' '}en {selectedNames.join(', ')}
            </>
          ) : (
            <>
              <strong>{pageData.totalProducts}</strong> productos en total
            </>
          )}
        </p>

        {pageError && <p className="error-text">{pageError}</p>}
        {!pageLoading && !pageError && pageData.content.length === 0 && (
          <div className="empty-results">
            <p>No hay productos en las categorías seleccionadas.</p>
            {hasFilters && (
              <button type="button" className="btn btn-primary" onClick={clearFilters}>Ver todos los productos</button>
            )}
          </div>
        )}
        <div className={`product-grid ${pageLoading ? 'is-loading' : ''}`}>
          {pageData.content.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <Pagination page={page} totalPages={pageData.totalPages} onChange={changePage} />
      </section>
    </div>
  );
}
