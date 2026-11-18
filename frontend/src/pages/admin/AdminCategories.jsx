import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteCategory, getCategories } from '../../services/catalogService.js';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `¿Eliminar la categoría "${category.title}"? Los productos asociados quedarán sin categoría.`
    );
    if (!confirmed) return;
    try {
      await deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      setError(err.message);
    }
  };

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

      {!loading && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Título</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td><img src={category.image} alt="" className="table-thumb" /></td>
                <td>{category.title}</td>
                <td>{category.description}</td>
                <td>
                  <button type="button" className="btn btn-danger" onClick={() => handleDelete(category)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan="4">No hay categorías cargadas.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
