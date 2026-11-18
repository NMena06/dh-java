import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createFeature, deleteFeature, getFeatures, updateFeature } from '../../services/catalogService.js';
import FeatureIcon, { ICON_OPTIONS } from '../../components/FeatureIcon.jsx';

const EMPTY = { name: '', icon: ICON_OPTIONS[0].value };

/**
 * Historia #17: "Administrar características". Listado con editar y eliminar,
 * y boton "Añadir nueva" para registrar nombre e icono.
 */
export default function AdminFeatures() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null = cerrado, 'new' o id
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getFeatures()
      .then(setFeatures)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openNew = () => {
    setEditing('new');
    setForm(EMPTY);
    setError('');
  };

  const openEdit = (feature) => {
    setEditing(feature.id);
    setForm({ name: feature.name, icon: feature.icon });
    setError('');
  };

  const close = () => {
    setEditing(null);
    setError('');
  };

  const sortByName = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'));

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing === 'new') {
        const created = await createFeature(form);
        setFeatures((prev) => sortByName([...prev, created]));
      } else {
        const updated = await updateFeature(editing, form);
        setFeatures((prev) => sortByName(prev.map((f) => (f.id === updated.id ? updated : f))));
      }
      setEditing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (feature) => {
    if (!window.confirm(`¿Eliminar la característica "${feature.name}"? Se quitará de los productos que la tengan.`)) return;
    try {
      await deleteFeature(feature.id);
      setFeatures((prev) => prev.filter((f) => f.id !== feature.id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <div className="admin-toolbar">
        <h1>Administrar características</h1>
        <div className="toolbar-actions">
          <button type="button" className="btn btn-primary" onClick={openNew}>Añadir nueva</button>
          <Link to="/administracion" className="btn btn-outline-dark">Volver al panel</Link>
        </div>
      </div>

      {editing !== null && (
        <form className="feature-form" onSubmit={handleSave} noValidate>
          <h2>{editing === 'new' ? 'Nueva característica' : 'Editar característica'}</h2>
          <label>
            Nombre
            <input type="text" value={form.name} maxLength={60} autoFocus
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <fieldset className="icon-picker">
            <legend>Ícono</legend>
            {ICON_OPTIONS.map((option) => (
              <label key={option.value} className={`icon-option ${form.icon === option.value ? 'selected' : ''}`}
                title={option.label}>
                <input type="radio" name="icon" value={option.value} checked={form.icon === option.value}
                  onChange={() => setForm((f) => ({ ...f, icon: option.value }))} />
                <FeatureIcon icon={option.value} size={24} />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          {error && <p className="error-text" role="alert">{error}</p>}
          <div className="toolbar-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" className="btn btn-outline-dark" onClick={close}>Cancelar</button>
          </div>
        </form>
      )}

      {loading && <p>Cargando características...</p>}
      {editing === null && error && <p className="error-text" role="alert">{error}</p>}

      {!loading && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ícono</th>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.id}>
                <td className="icon-cell"><FeatureIcon icon={feature.icon} /></td>
                <td>{feature.name}</td>
                <td className="actions-cell">
                  <button type="button" className="btn btn-outline-dark" onClick={() => openEdit(feature)}>Editar</button>
                  <button type="button" className="btn btn-danger" onClick={() => handleDelete(feature)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {features.length === 0 && (
              <tr><td colSpan="3">No hay características registradas.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
