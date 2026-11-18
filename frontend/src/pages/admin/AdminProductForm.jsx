import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createProduct, getProductById, updateProduct } from '../../services/productService.js';
import { getCategories, getFeatures } from '../../services/catalogService.js';
import { findTooBig, MAX_IMAGE_SIZE_MB, readFileAsDataUrl } from '../../utils/files.js';
import FeatureIcon from '../../components/FeatureIcon.jsx';

/**
 * Registrar producto y Editar producto (mismo formulario).
 * Permite elegir la categoria (historia #12) y asociar una o mas caracteristicas (historia #17).
 */
export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [featureIds, setFeatureIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [features, setFeatures] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const requests = [getCategories(), getFeatures()];
    if (isEdit) requests.push(getProductById(id));
    Promise.all(requests)
      .then(([categoryList, featureList, product]) => {
        setCategories(categoryList);
        setFeatures(featureList);
        if (product) {
          setName(product.name);
          setDescription(product.description);
          setExistingImages(product.images ?? []);
          setCategoryId(product.category?.id ? String(product.category.id) : '');
          setFeatureIds((product.features ?? []).map((f) => f.id));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    const tooBig = findTooBig(selected);
    if (tooBig) {
      setError(`La imagen "${tooBig.name}" supera los ${MAX_IMAGE_SIZE_MB} MB`);
      setFiles([]);
      return;
    }
    setError('');
    setFiles(selected);
  };

  const toggleFeature = (featureId) => {
    setFeatureIds((prev) =>
      prev.includes(featureId) ? prev.filter((x) => x !== featureId) : [...prev, featureId]
    );
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim() || !description.trim()) {
      setError('Nombre y descripción son obligatorios');
      return;
    }
    if (existingImages.length + files.length === 0) {
      setError('Debes subir al menos una imagen');
      return;
    }

    setSubmitting(true);
    try {
      const newImages = await Promise.all(files.map(readFileAsDataUrl));
      const payload = {
        name,
        description,
        images: [...existingImages, ...newImages],
        categoryId: categoryId ? Number(categoryId) : null,
        featureIds,
      };
      if (isEdit) await updateProduct(id, payload);
      else await createProduct(payload);
      navigate('/administracion/productos');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <section className="admin-form-section">
      <div className="admin-toolbar">
        <h1>{isEdit ? 'Editar producto' : 'Agregar producto'}</h1>
        <Link to={isEdit ? '/administracion/productos' : '/administracion'} className="btn btn-outline-dark">
          {isEdit ? 'Volver a la lista' : 'Volver al panel'}
        </Link>
      </div>

      <form className="admin-form" onSubmit={handleSubmit} noValidate>
        <label>
          Nombre
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </label>

        <label>
          Descripción
          <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        </label>

        <label>
          Categoría
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </label>

        <fieldset className="feature-picker">
          <legend>Características</legend>
          {features.length === 0 && (
            <p className="muted">
              No hay características. <Link to="/administracion/caracteristicas">Crear una</Link>
            </p>
          )}
          <div className="feature-picker-grid">
            {features.map((feature) => (
              <label key={feature.id} className={`feature-option ${featureIds.includes(feature.id) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={featureIds.includes(feature.id)}
                  onChange={() => toggleFeature(feature.id)}
                />
                <FeatureIcon icon={feature.icon} size={20} />
                <span>{feature.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {isEdit && existingImages.length > 0 && (
          <div className="existing-images">
            <span className="form-label">Imágenes actuales</span>
            <div className="thumb-row">
              {existingImages.map((src, index) => (
                <div key={index} className="thumb-item">
                  <img src={src} alt={`Imagen ${index + 1}`} />
                  <button type="button" className="thumb-remove" onClick={() => removeExistingImage(index)}
                    aria-label={`Quitar imagen ${index + 1}`}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <label>
          {isEdit ? 'Agregar imágenes' : 'Imágenes'} (una o más, máximo {MAX_IMAGE_SIZE_MB} MB c/u)
          <input type="file" accept="image/*" multiple onChange={handleFiles} />
        </label>

        {files.length > 0 && <p>{files.length} imagen(es) seleccionada(s)</p>}
        {error && <p className="error-text" role="alert">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar producto'}
        </button>
      </form>
    </section>
  );
}
