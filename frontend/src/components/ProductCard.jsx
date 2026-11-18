import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton.jsx';
import { RatingSummary } from './StarRating.jsx';

export default function ProductCard({ product }) {
  const cover = product.images?.[0];

  return (
    <article className="product-card">
      <div className="product-card-image">
        {cover ? <img src={cover} alt={product.name} /> : <div className="no-image">Sin imagen</div>}
        <FavoriteButton product={product} className="on-image" />
      </div>
      <div className="product-card-body">
        {product.category && <span className="category-badge small">{product.category.title}</span>}
        <h3>{product.name}</h3>
        <RatingSummary average={product.ratingAverage} count={product.ratingCount} compact />
        <p>{product.description}</p>
        <Link to={`/productos/${product.id}`} className="btn btn-primary">Ver detalle</Link>
      </div>
    </article>
  );
}
