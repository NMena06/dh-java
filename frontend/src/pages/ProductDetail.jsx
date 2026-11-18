import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductGallery from '../components/ProductGallery.jsx';
import ProductFeatures from '../components/ProductFeatures.jsx';
import ProductPolicies from '../components/ProductPolicies.jsx';
import ProductAvailability from '../components/ProductAvailability.jsx';
import ProductReviews from '../components/ProductReviews.jsx';
import ShareModal from '../components/ShareModal.jsx';
import FavoriteButton from '../components/FavoriteButton.jsx';
import { RatingSummary } from '../components/StarRating.jsx';
import { getProductById } from '../services/productService.js';
import { useAuth } from '../context/AuthContext.jsx';
import PinIcon from '../components/PinIcon.jsx';
import { toISO } from '../utils/dates.js';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError('');
    getProductById(id)
      .then(setProduct)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="page-padding">Cargando producto...</p>;

  if (error || !product) {
    return (
      <div className="page-padding">
        <p className="error-text">{error || 'Producto no encontrado'}</p>
        <Link to="/">Volver al inicio</Link>
      </div>
    );
  }

  /**
   * Historia #30: al reservar se verifica si hay sesion. Con sesion se va a la pagina de reserva
   * (con las fechas elegidas en el calendario, si las hay); sin sesion, al login con el aviso de login obligatorio.
   */
  const handleReserve = (range = {}) => {
    const params = new URLSearchParams();
    if (range.start && range.end) {
      params.set('checkIn', toISO(range.start));
      params.set('checkOut', toISO(range.end));
    }
    const query = params.toString();
    const target = `/productos/${product.id}/reservar${query ? `?${query}` : ''}`;
    if (isAuthenticated) navigate(target);
    else navigate('/login', { state: { from: target, reason: 'reserva' } });
  };

  // La media se actualiza en el encabezado apenas se publica una valoracion (historia #28)
  const handleRated = (summary) =>
    setProduct((prev) => ({ ...prev, ratingAverage: summary.average, ratingCount: summary.count }));

  return (
    <div className="product-detail">
      <div className="detail-header">
        <div className="detail-title">
          <h1>{product.name}</h1>
          <a href="#reviews-title" className="detail-rating">
            <RatingSummary average={product.ratingAverage} count={product.ratingCount} />
          </a>
        </div>
        <div className="detail-actions">
          <button type="button" className="icon-button" onClick={() => setSharing(true)} aria-label="Compartir producto" title="Compartir">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <circle cx="18" cy="5" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="6" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="18" cy="19" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          <FavoriteButton product={product} className="icon-button" />
          <button
            type="button"
            className="back-button"
            onClick={() => navigate(-1)}
            aria-label="Volver atrás"
            title="Volver atrás"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="detail-body">
        <ProductGallery images={product.images} name={product.name} />
        <div className="detail-meta">
          {product.category && <span className="category-badge">{product.category.title}</span>}
          {product.location && <span className="location-text detail-location"><PinIcon size={17} /> {product.location}</span>}
        </div>
        <p className="detail-description">{product.description}</p>
        <div className="reserve-cta">
          <div>
            <strong>¿Te interesa este producto?</strong>
            <span>Elige tus fechas y confirma tu reserva en pocos pasos.</span>
          </div>
          <button type="button" className="btn btn-accent" onClick={() => handleReserve()}>Reservar</button>
        </div>
        <ProductFeatures features={product.features} />
        <ProductAvailability productId={product.id} onReserve={handleReserve} />
        <ProductReviews productId={product.id} onRated={handleRated} />
      </div>
      <ProductPolicies policies={product.policies} />

      {sharing && <ShareModal product={product} onClose={() => setSharing(false)} />}
    </div>
  );
}
