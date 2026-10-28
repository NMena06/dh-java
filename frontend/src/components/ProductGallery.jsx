import { useState } from 'react';

/**
 * Galeria: imagen principal a la izquierda, grilla 2x2 a la derecha
 * y boton "Ver más" en la esquina inferior derecha que abre todas las imagenes.
 */
export default function ProductGallery({ images = [], name }) {
  const [showAll, setShowAll] = useState(false);

  if (images.length === 0) {
    return <div className="gallery-empty">Este producto no tiene imágenes.</div>;
  }

  const main = images[0];
  const side = images.slice(1, 5);

  return (
    <section className="gallery">
      <div className="gallery-main">
        <img src={main} alt={`${name} - imagen principal`} />
      </div>

      <div className="gallery-grid">
        {Array.from({ length: 4 }).map((_, index) => {
          const src = side[index];
          return (
            <div key={index} className="gallery-thumb">
              {src ? <img src={src} alt={`${name} - imagen ${index + 2}`} /> : null}
            </div>
          );
        })}
        {images.length >= 5 && (
          <button type="button" className="gallery-more" onClick={() => setShowAll(true)}>
            Ver más
          </button>
        )}
      </div>

      {showAll && (
        <div className="modal-overlay" onClick={() => setShowAll(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Todas las imágenes ({images.length})</h3>
              <button type="button" className="btn btn-outline" onClick={() => setShowAll(false)}>
                Cerrar
              </button>
            </div>
            <div className="modal-grid">
              {images.map((src, index) => (
                <img key={index} src={src} alt={`${name} - imagen ${index + 1}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
