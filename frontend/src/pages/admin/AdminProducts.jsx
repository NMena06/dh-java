import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { assignProductCategory, deleteProduct, getProducts } from '../../services/productService.js';
import { getCategories } from '../../services/catalogService.js';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([productList, categoryList]) => {
        setProducts(productList);
        setCategories(categoryList);
      })
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

  /** Historia #12: asignar categoria a un producto ya creado directamente desde la lista. */
  const handleCategoryChange = async (product, value) => {
    setError('');
    setNotice('');
    setSavingId(product.id);
    try {
      const updated = await assignProductCategory(product.id, value ? Number(value) : null);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      setNotice(`Categoría de "${product.name}" actualizada.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="admin-products">
      <div className="admin-toolbar">
        <h1>Lista de productos</h1>
        <div className="toolbar-actions">
          <Link to="/administracion/productos/nuevo" className="btn btn-primary">Agregar producto</Link>
          <Link to="/administracion" className="btn btn-outline-dark">Volver al panel</Link>
        </div>
      </div>

      {loading && <p>Cargando productos...</p>}
      {error && <p className="error-text" role="alert">{error}</p>}
      {notice && <p className="success-text" role="status">{notice}</p>}

      {!loading && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>
                  <select
                    className="inline-select"
                    aria-label={`Categoría de ${product.name}`}
                    value={product.category?.id ?? ''}
                    disabled={savingId === product.id}
                    onChange={(e) => handleCategoryChange(product, e.target.value)}
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </td>
                <td className="actions-cell">
                  <Link to={`/administracion/productos/${product.id}/editar`} className="btn btn-outline-dark">
                    Editar
                  </Link>
                  <button type="button" className="btn btn-danger" onClick={() => handleDelete(product)}>
                    Eliminar producto
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="4">No hay productos cargados.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
