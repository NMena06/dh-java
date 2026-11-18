import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteCategory, getCategories } from '../../services/catalogService.js';
import { getProducts } from '../../services/productService.js';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

/**
 * Lista de categorías con opción de eliminar (historias #21 y #29).
 * Antes de borrar se pide confirmación indicando la categoría y cuántos productos quedarán sin categoría.
 */
export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([getCategories(), getProducts()])
      .then(([categoryList, products]) => {
        setCategories(categoryList);
        const counts = {};
        products.forEach((p) => {
          if (p.category) counts[p.category.id] = (counts[p.category.id] ?? 0) + 1;
        });
        setProductCounts(counts);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const confirmDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await deleteCategory(toDelete.id);
      setCategories((prev) => prev.filter((c) => c.id !== toDelete.id));
      setNotice(`La categoría "${toDelete.title}" fue eliminada.`);
      setToDelete(null);
    } catch (err) {
      setError(err.message);
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const affected = toDelete ? productCounts[toDelete.id] ?? 0 : 0;

  return (
    <section>
      <div className="admin-toolbar">
        <h1>Categorías</h1>
        <div className="toolbar-actions">
          <Link to="/administracion/categorias/nueva" className="btn btn-primary">Agregar categoría</Link>
          <Link to="/administracion" className="btn btn-outline-dark">Volver al panel</Link>
        </div>
      </div>

      {loading && <p>Cargando categorías...</p>}
      {error && <p className="error-text" role="alert">{error}</p>}
      {notice && <p className="success-text" role="status">{notice}</p>}

      {!loading && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Título</th>
              <th>Descripción</th>
              <th>Productos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td><img src={category.image} alt="" className="table-thumb" /></td>
                <td>{category.title}</td>
                <td>{category.description}</td>
                <td>{productCounts[category.id] ?? 0}</td>
                <td>
                  <button type="button" className="btn btn-danger" onClick={() => { setNotice(''); setToDelete(category); }}>
                    Eliminar categoría
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan="5">No hay categorías cargadas.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {toDelete && (
        <ConfirmDialog
          title="¿Eliminar categoría?"
          confirmLabel="Confirmar"
          danger
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        >
          <p>Vas a eliminar la categoría <strong>“{toDelete.title}”</strong>.</p>
          <p>
            {affected > 0
              ? <><strong>{affected} {affected === 1 ? 'producto asociado quedará' : 'productos asociados quedarán'} sin categoría</strong> y {affected === 1 ? 'dejará' : 'dejarán'} de aparecer en el filtro por categoría. Los productos no se eliminan.</>
              : 'No hay productos asociados a esta categoría.'}
          </p>
          <p className="warning-text">Esta acción no se puede deshacer.</p>
        </ConfirmDialog>
      )}
    </section>
  );
}
