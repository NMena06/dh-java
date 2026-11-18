import { useState } from 'react';

const STAR_PATH = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';

/** Estrellas de solo lectura (admite medias por relleno parcial). */
export function Stars({ value = 0, size = 16 }) {
  return (
    <span className="stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <svg key={n} viewBox="0 0 24 24" width={size} height={size} className="star">
            <defs>
              <linearGradient id={`g${n}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                <stop offset={`${fill * 100}%`} stopColor="transparent" />
              </linearGradient>
            </defs>
            <path d={STAR_PATH} fill={`url(#g${n}-${Math.round(fill * 100)})`} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        );
      })}
    </span>
  );
}

/** Resumen "★★★★☆ 4.5 (12 valoraciones)" usado en tarjetas y en el detalle (historia #28). */
export function RatingSummary({ average = 0, count = 0, compact = false }) {
  if (!count) {
    return <span className="rating-summary empty">{compact ? 'Sin valoraciones' : 'Todavía no tiene valoraciones'}</span>;
  }
  const text = `${average.toFixed(1)} de 5, ${count} ${count === 1 ? 'valoración' : 'valoraciones'}`;
  return (
    <span className="rating-summary" aria-label={text} title={text}>
      <Stars value={average} />
      <strong>{average.toFixed(1)}</strong>
      <span className="rating-count">({count} {count === 1 ? 'valoración' : 'valoraciones'})</span>
    </span>
  );
}

const LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

/** Selector de 1 a 5 estrellas, accesible con teclado (radio buttons). */
export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="star-input" role="radiogroup" aria-label="Puntuación" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={n <= shown ? 'on' : ''} onMouseEnter={() => setHover(n)}>
          <input type="radio" name="rating" value={n} checked={value === n} onChange={() => onChange(n)}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`} />
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
            <path d={STAR_PATH} fill={n <= shown ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </label>
      ))}
      <span className="star-label">{LABELS[shown] || 'Elige una puntuación'}</span>
    </div>
  );
}
