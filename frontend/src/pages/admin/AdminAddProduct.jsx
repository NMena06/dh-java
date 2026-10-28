import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createProduct } from '../../services/productService.js';

const MAX_IMAGE_SIZE_MB = 2;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`No se pudo leer la imagen ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export default function AdminAddProduct() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    const tooBig = selected.find((f) => f.size > MAX_IMAGE_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      setError(`La imagen "${tooBig.name}" supera los ${MAX_IMAGE_SIZE_MB} MB`);
      setFiles([]);
      return;
    }
    setError('');
    setFiles(selected);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim() || !description.trim()) {
      setError('Nombre y descripción son obligatorios');
      return;
    }
    if (files.length === 0) {
      setError('Debes subir al menos una imagen');
      return;
    }

    setSubmitting(true);
    try {
      const images = await Promise.all(files.map(readFileAsDataUrl));
      await createProduct({ name, description, images });
      navigate('/administracion/productos');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="admin-form-section">
      <div className="admin-toolbar">
        <h1>Agregar producto</h1>
        <Link to="/administracion" className="btn btn-outline">Volver al panel</Link>
      </div>

      <form className="admin-form" onSubmit={handleSubmit} noValidate>
        <label>
          Nombre
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </label>

        <label>
          Descripción
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
          />
        </label>

        <label>
          Imágenes (una o más, máximo {MAX_IMAGE_SIZE_MB} MB c/u)
          <input type="file" accept="image/*" multiple onChange={handleFiles} />
        </label>

        {files.length > 0 && <p>{files.length} imagen(es) seleccionada(s)</p>}
        {error && <p className="error-text" role="alert">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar producto'}
        </button>
      </form>
    </section>
  );
}
