import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const cover = product.images?.[0];

  return (
    <article className="product-card">
      <div className="product-card-image">
        {cover ? <img src={cover} alt={product.name} /> : <div className="no-image">Sin imagen</div>}
      </div>
      <div className="product-card-body">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <Link to={`/productos/${product.id}`} className="btn btn-primary">Ver detalle</Link>
      </div>
    </article>
  );
}
