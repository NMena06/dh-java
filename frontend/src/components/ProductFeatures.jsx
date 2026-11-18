import FeatureIcon from './FeatureIcon.jsx';

/**
 * Bloque "Características" del detalle de producto (historia #18).
 * Grilla responsiva: 4 columnas en escritorio, 2 en tablet y 1 en móvil (ver CSS .features-grid).
 */
export default function ProductFeatures({ features = [] }) {
  return (
    <section className="product-features" aria-labelledby="features-title">
      <h2 id="features-title">Características</h2>
      {features.length === 0 ? (
        <p className="muted">Este producto todavía no tiene características cargadas.</p>
      ) : (
        <ul className="features-grid">
          {features.map((feature) => (
            <li key={feature.id} className="feature-item">
              <FeatureIcon icon={feature.icon} />
              <span>{feature.name}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
