import { useCallback, useEffect, useMemo, useState } from 'react';
import DoubleCalendar from './DoubleCalendar.jsx';
import { getAvailability } from '../services/searchService.js';
import { addMonths, bookedDaySet, formatLong, nightsBetween, startOfMonth, toISO, today } from '../utils/dates.js';

/**
 * Disponibilidad del producto (historia #23): calendario doble con las fechas ocupadas destacadas.
 * Si falla la consulta, muestra un mensaje claro y la opción de reintentar.
 */
export default function ProductAvailability({ productId, onReserve }) {
  const [ranges, setRanges] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [selection, setSelection] = useState({ start: null, end: null });

  const load = useCallback(() => {
    setStatus('loading');
    const from = startOfMonth(today());
    getAvailability(productId, toISO(from), toISO(addMonths(from, 12)))
      .then((data) => {
        setRanges(data.bookedRanges);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const booked = useMemo(() => bookedDaySet(ranges), [ranges]);
  const nights = selection.start && selection.end ? nightsBetween(selection.start, selection.end) : 0;

  return (
    <section className="product-availability" aria-labelledby="availability-title">
      <h2 id="availability-title">Fechas disponibles</h2>

      {status === 'loading' && <p className="muted">Cargando disponibilidad...</p>}

      {status === 'error' && (
        <div className="availability-error" role="alert">
          <p><strong>No pudimos obtener la disponibilidad en este momento.</strong> Por favor, inténtalo de nuevo más tarde.</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={load}>Reintentar</button>
        </div>
      )}

      {status === 'ready' && (
        <div className="availability-body">
          <DoubleCalendar value={selection} onChange={setSelection} booked={booked} label="Disponibilidad del producto" />
          <div className="availability-side">
            <ul className="calendar-legend">
              <li><span className="swatch available" /> Disponible</li>
              <li><span className="swatch booked" /> Ocupado</li>
              <li><span className="swatch selected" /> Tu selección</li>
            </ul>
            <p className="availability-hint" aria-live="polite">
              {nights > 0
                ? <>Del <strong>{formatLong(selection.start)}</strong> al <strong>{formatLong(selection.end)}</strong>: {nights} {nights === 1 ? 'noche' : 'noches'} disponibles.</>
                : 'Elige la fecha de entrada y la de salida para comprobar la disponibilidad.'}
            </p>
            {onReserve && (
              <button type="button" className="btn btn-accent btn-block reserve-dates" onClick={() => onReserve(selection)}>
                {nights > 0 ? 'Reservar estas fechas' : 'Reservar'}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
