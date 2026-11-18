import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { RatingSummary } from '../components/StarRating.jsx';

/**
 * "Mis favoritos" (historia #25). Lee el estado compartido de favoritos, así que se actualiza
 * al instante cuando se marca o desmarca un producto en cualquier parte del sitio.
 */
export default function Favorites() {
  const { favorites, toggle, loading, error, reload } = useFavorites();

  return (
    <section className="favorites-page">
      <div className="favorites-header">
        <h1>Mis favoritos</h1>
        <p className="muted">
          {favorites.length === 0 ? 'Todavía no guardaste productos.' : `${favorites.length} ${favorites.length === 1 ? 'producto guardado' : 'productos guardados'}`}
        </p>
      </div>

      {loading && favorites.length === 0 && <p>Cargando favoritos...</p>}
      {error && (
        <p className="error-text" role="alert">{error} <button type="button" className="link-button" onClick={reload}>Reintentar</button></p>
      )}

      {!loading && !error && favorites.length === 0 && (
        <div className="empty-results">
          <p>Toca el corazón de cualquier producto para guardarlo aquí.</p>
          <Link to="/" className="btn btn-primary">Explorar productos</Link>
        </div>
      )}

      <ul className="favorites-list">
        {favorites.map((product) => (
          <li key={product.id} className="favorite-item">
            <Link to={`/productos/${product.id}`} className="favorite-thumb">
              {product.images?.[0] ? <img src={product.images[0]} alt="" /> : <span className="no-image">Sin imagen</span>}
            </Link>
            <div className="favorite-info">
              {product.category && <span className="category-badge small">{product.category.title}</span>}
              <Link to={`/productos/${product.id}`} className="favorite-name">{product.name}</Link>
              <RatingSummary average={product.ratingAverage} count={product.ratingCount} compact />
              <p>{product.description}</p>
            </div>
            <button type="button" className="btn btn-outline-danger" onClick={() => toggle(product)}
              aria-label={`Quitar ${product.name} de favoritos`}>
              Quitar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
