import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteProduct, getProducts } from '../../services/productService.js';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (product) => {
    const confirmed = window.confirm(`¿Seguro que deseas eliminar "${product.name}"?`);
    if (!confirmed) return;

    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="admin-products">
      <div className="admin-toolbar">
        <h1>Lista de productos</h1>
        <Link to="/administracion" className="btn btn-outline">Volver al panel</Link>
      </div>

      {loading && <p>Cargando productos...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>
                  <button type="button" className="btn btn-danger" onClick={() => handleDelete(product)}>
                    Eliminar producto
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="3">No hay productos cargados.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
