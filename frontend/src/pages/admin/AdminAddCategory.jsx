import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createCategory } from '../../services/catalogService.js';
import { findTooBig, MAX_IMAGE_SIZE_MB, readFileAsDataUrl } from '../../utils/files.js';

/** Historia #21: agregar categoria con titulo, descripcion e imagen representativa. */
export default function AdminAddCategory() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    setImage('');
    if (!file) return;
    if (findTooBig([file])) {
      setError(`La imagen supera los ${MAX_IMAGE_SIZE_MB} MB`);
      return;
    }
    setError('');
    setImage(await readFileAsDataUrl(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!title.trim() || !description.trim()) {
      setError('Título y descripción son obligatorios');
      return;
    }
    if (!image) {
      setError('Debes subir una imagen representativa');
      return;
    }
    setSubmitting(true);
    try {
      await createCategory({ title, description, image });
      navigate('/administracion/categorias');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="admin-form-section">
      <div className="admin-toolbar">
        <h1>Agregar categoría</h1>
        <Link to="/administracion" className="btn btn-outline-dark">Volver al panel</Link>
      </div>

      <form className="admin-form" onSubmit={handleSubmit} noValidate>
        <label>
          Título
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
        </label>
        <label>
          Descripción
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </label>
        <label>
          Imagen representativa (máximo {MAX_IMAGE_SIZE_MB} MB)
          <input type="file" accept="image/*" onChange={handleFile} />
        </label>
        {image && <img src={image} alt="Vista previa" className="category-preview" />}
        {error && <p className="error-text" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar categoría'}
        </button>
      </form>
    </section>
  );
}
