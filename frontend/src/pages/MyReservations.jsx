import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyReservations } from '../services/reservationService.js';
import { formatLong, fromISO } from '../utils/dates.js';
import PinIcon from '../components/PinIcon.jsx';

const STATUS = {
  UPCOMING: { label: 'Próxima', className: 'status-upcoming' },
  IN_PROGRESS: { label: 'En curso', className: 'status-progress' },
  COMPLETED: { label: 'Finalizada', className: 'status-completed' },
};

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'UPCOMING', label: 'Próximas' },
  { id: 'COMPLETED', label: 'Anteriores' },
];

/**
 * Historial de reservas (historia #33): lista ordenada por fecha de uso (la más reciente primero)
 * con producto, fecha de reserva, fechas de uso, noches, estado y código.
 */
export default function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = () => {
    setLoading(true);
    setError('');
    getMyReservations()
      .then(setReservations)
      .catch(() => setError('No pudimos cargar tus reservas.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const visible = useMemo(() => reservations.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'UPCOMING') return r.status !== 'COMPLETED';
    return r.status === 'COMPLETED';
  }), [reservations, filter]);

  return (
    <section className="reservations-page">
      <div className="favorites-header">
        <h1>Mis reservas</h1>
        <p className="muted">Ordenadas por fecha de uso, de la más reciente a la más antigua.</p>
      </div>

      <div className="filter-chips history-filters" role="tablist" aria-label="Filtrar reservas">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id}
            className={`chip ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p>Cargando reservas...</p>}
      {error && (
        <p className="error-text" role="alert">{error} <button type="button" className="link-button" onClick={load}>Reintentar</button></p>
      )}
      {!loading && !error && visible.length === 0 && (
        <div className="empty-results">
          <p>{reservations.length === 0 ? 'Todavía no hiciste ninguna reserva.' : 'No hay reservas en esta categoría.'}</p>
          <Link to="/" className="btn btn-primary">Buscar productos</Link>
        </div>
      )}

      <ul className="reservation-list">
        {visible.map((r) => (
          <li key={r.id} className="reservation-item">
            <Link to={`/productos/${r.product.id}`} className="favorite-thumb">
              {r.product.image ? <img src={r.product.image} alt="" /> : <span className="no-image">Sin imagen</span>}
            </Link>
            <div className="reservation-info">
              <div className="reservation-top">
                <span className={`status-badge ${STATUS[r.status].className}`}>{STATUS[r.status].label}</span>
                <span className="reservation-code-small">{r.code}</span>
              </div>
              <Link to={`/productos/${r.product.id}`} className="favorite-name">{r.product.name}</Link>
              {r.product.location && <span className="location-text"><PinIcon /> {r.product.location}</span>}
              <dl className="reservation-dates">
                <div><dt>Fechas de uso</dt><dd>{formatLong(fromISO(r.startDate))} → {formatLong(fromISO(r.endDate))} ({r.nights} {r.nights === 1 ? 'noche' : 'noches'})</dd></div>
                <div><dt>Fecha de reserva</dt><dd>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</dd></div>
                {r.guests != null && <div><dt>Personas</dt><dd>{r.guests}</dd></div>}
              </dl>
            </div>
            <Link to={`/reservas/${r.id}/confirmacion`} className="btn btn-outline-dark btn-sm">Ver detalle</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
