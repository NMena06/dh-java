import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductGallery from '../components/ProductGallery.jsx';
import { getProductById } from '../services/productService.js';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
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

  return (
    <div className="product-detail">
      <div className="detail-header">
        <h1>{product.name}</h1>
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(-1)}
          aria-label="Volver atrás"
          title="Volver atrás"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M19 12H5M11 6l-6 6 6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="detail-body">
        <ProductGallery images={product.images} name={product.name} />
        <p className="detail-description">{product.description}</p>
      </div>
    </div>
  );
}
