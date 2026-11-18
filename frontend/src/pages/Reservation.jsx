import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import DoubleCalendar from '../components/DoubleCalendar.jsx';
import FeatureIcon from '../components/FeatureIcon.jsx';
import PinIcon from '../components/PinIcon.jsx';
import { RatingSummary } from '../components/StarRating.jsx';
import { getProductById } from '../services/productService.js';
import { getAvailability } from '../services/searchService.js';
import { createReservation } from '../services/reservationService.js';
import {
  addDays, addMonths, bookedDaySet, formatLong, fromISO, nightsBetween, startOfMonth, toISO, today,
} from '../utils/dates.js';

const PHONE_REGEX = /^\+?[0-9 ()-]{6,20}$/;

/** Traduce los mensajes del backend a textos con tildes y una indicacion de como resolverlos. */
function friendlyError(err) {
  if (err.status === 409) {
    return 'Esas fechas acaban de ser reservadas por otra persona. Actualizamos el calendario: elige otro rango y vuelve a confirmar.';
  }
  if (err.status === 401) return 'Tu sesión venció. Inicia sesión nuevamente para completar la reserva.';
  if (err.status === 404) return 'El producto ya no está disponible. Vuelve al inicio y elige otro.';
  if (err.message === 'La fecha de entrada no puede ser anterior a hoy') return 'La fecha de entrada no puede ser anterior a hoy. Elige una fecha a partir de hoy.';
  if (err.message?.includes('noches')) return `${err.message}. Elige un rango más corto.`;
  if (err.status >= 500 || err.message === 'Failed to fetch') {
    return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo; tu reserva todavía no se realizó.';
  }
  return err.message;
}

/**
 * Página de reserva (historias #30, #31 y #32): detalle del producto, datos del usuario, selección de fechas
 * con calendario doble (no permite rangos con fechas ocupadas), datos opcionales y botón para confirmar.
 */
export default function Reservation() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [ranges, setRanges] = useState([]);
  const [availabilityError, setAvailabilityError] = useState(false);
  const [range, setRange] = useState({ start: null, end: null });
  const [guests, setGuests] = useState('');
  const [phone, setPhone] = useState('');
  const [comments, setComments] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const booked = useMemo(() => bookedDaySet(ranges), [ranges]);

  const loadAvailability = useCallback(() => {
    setAvailabilityError(false);
    const from = startOfMonth(today());
    return getAvailability(id, toISO(from), toISO(addMonths(from, 12)))
      .then((data) => {
        setRanges(data.bookedRanges);
        return bookedDaySet(data.bookedRanges);
      })
      .catch(() => {
        setAvailabilityError(true);
        return null;
      });
  }, [id]);

  useEffect(() => {
    getProductById(id).then(setProduct).catch((err) => setLoadError(err.message));
    // Fechas recibidas desde el detalle: se aceptan solo si siguen siendo validas y libres
    loadAvailability().then((bookedSet) => {
      const start = fromISO(params.get('checkIn'));
      const end = fromISO(params.get('checkOut'));
      if (!start || !end || start < today() || end <= start || !bookedSet) return;
      for (let d = start; d < end; d = addDays(d, 1)) if (bookedSet.has(toISO(d))) return;
      setRange({ start, end });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loadAvailability]);

  const nights = range.start && range.end ? nightsBetween(range.start, range.end) : 0;

  const validate = () => {
    const found = {};
    if (!range.start || !range.end) found.dates = 'Elige la fecha de entrada y la de salida en el calendario.';
    if (guests !== '' && (!Number.isInteger(Number(guests)) || Number(guests) < 1 || Number(guests) > 20)) {
      found.guests = 'Indica entre 1 y 20 personas.';
    }
    if (phone.trim() && !PHONE_REGEX.test(phone.trim())) found.phone = 'El teléfono no es válido. Usa solo números, espacios, guiones y el prefijo +.';
    return found;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const reservation = await createReservation({
        productId: Number(id),
        startDate: toISO(range.start),
        endDate: toISO(range.end),
        guests: guests === '' ? null : Number(guests),
        phone: phone.trim() || null,
        comments: comments.trim() || null,
      });
      navigate(`/reservas/${reservation.id}/confirmacion`, { replace: true, state: { reservation } });
    } catch (err) {
      setSubmitError(friendlyError(err));
      if (err.fieldErrors?.phone) setErrors((e) => ({ ...e, phone: 'El teléfono no es válido.' }));
      if (err.fieldErrors?.guests) setErrors((e) => ({ ...e, guests: 'Indica entre 1 y 20 personas.' }));
      if (err.status === 409) {
        setRange({ start: null, end: null });
        loadAvailability();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="page-padding">
        <p className="error-text">{loadError}</p>
        <Link to="/">Volver al inicio</Link>
      </div>
    );
  }
  if (!product) return <p className="page-padding">Cargando reserva...</p>;

  return (
    <div className="reservation-page">
      <div className="detail-header">
        <div className="detail-title">
          <span className="eyebrow">Reservar</span>
          <h1>{product.name}</h1>
        </div>
        <Link to={`/productos/${product.id}`} className="back-button" aria-label="Volver al producto" title="Volver al producto">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <form className="reservation-layout" onSubmit={handleSubmit} noValidate>
        <div className="reservation-main">
          {/* Datos del usuario (#31) */}
          <section className="res-card" aria-labelledby="res-user">
            <h2 id="res-user">Tus datos</h2>
            <div className="form-grid">
              <div className="field"><label htmlFor="r-first">Nombre</label><input id="r-first" value={user.firstName} readOnly /></div>
              <div className="field"><label htmlFor="r-last">Apellido</label><input id="r-last" value={user.lastName} readOnly /></div>
              <div className="field span-2"><label htmlFor="r-email">Correo electrónico</label><input id="r-email" value={user.email} readOnly /></div>
              <div className={`field ${errors.phone ? 'has-error' : ''}`}>
                <label htmlFor="r-phone">Teléfono de contacto <small>(opcional)</small></label>
                <input id="r-phone" type="tel" value={phone} maxLength={20} placeholder="+54 11 5555-5555"
                  onChange={(e) => setPhone(e.target.value)} aria-invalid={Boolean(errors.phone)} />
                {errors.phone && <small className="field-error" role="alert">{errors.phone}</small>}
              </div>
              <div className={`field ${errors.guests ? 'has-error' : ''}`}>
                <label htmlFor="r-guests">Cantidad de personas <small>(opcional)</small></label>
                <input id="r-guests" type="number" min="1" max="20" value={guests}
                  onChange={(e) => setGuests(e.target.value)} aria-invalid={Boolean(errors.guests)} />
                {errors.guests && <small className="field-error" role="alert">{errors.guests}</small>}
              </div>
              <div className="field span-2">
                <label htmlFor="r-comments">Comentarios para el proveedor <small>(opcional)</small></label>
                <textarea id="r-comments" rows={3} maxLength={500} value={comments}
                  placeholder="Ej.: llegamos tarde, necesitamos cuna, talle M..." onChange={(e) => setComments(e.target.value)} />
                <small className="field-hint">{comments.length}/500</small>
              </div>
            </div>
          </section>

          {/* Fechas (#30) */}
          <section className="res-card" aria-labelledby="res-dates">
            <h2 id="res-dates">Selecciona tus fechas</h2>
            <div className="form-grid">
              <div className="field"><label htmlFor="r-in">Fecha de entrada</label>
                <input id="r-in" readOnly value={range.start ? formatLong(range.start) : ''} placeholder="Elige en el calendario" /></div>
              <div className="field"><label htmlFor="r-out">Fecha de salida</label>
                <input id="r-out" readOnly value={range.end ? formatLong(range.end) : ''} placeholder="Elige en el calendario" /></div>
            </div>
            {availabilityError ? (
              <div className="availability-error" role="alert">
                <p><strong>No pudimos obtener la disponibilidad en este momento.</strong> Inténtalo de nuevo en unos segundos.</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={loadAvailability}>Reintentar</button>
              </div>
            ) : (
              <>
                <DoubleCalendar value={range} onChange={(v) => { setRange(v); setErrors((e) => ({ ...e, dates: undefined })); }}
                  booked={booked} label="Fechas de la reserva" />
                <ul className="calendar-legend inline">
                  <li><span className="swatch available" /> Disponible</li>
                  <li><span className="swatch booked" /> Ocupado</li>
                  <li><span className="swatch selected" /> Tu selección</li>
                </ul>
              </>
            )}
            {errors.dates && <p className="field-error" role="alert">{errors.dates}</p>}
          </section>
        </div>

        {/* Detalle del producto y resumen (#31) */}
        <aside className="reservation-side">
          <div className="res-card product-summary">
            {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="summary-cover" />}
            {product.images?.length > 1 && (
              <div className="summary-thumbs">
                {product.images.slice(1, 4).map((src, i) => <img key={i} src={src} alt="" />)}
              </div>
            )}
            <div className="summary-body">
              {product.category && <span className="category-badge small">{product.category.title}</span>}
              <h3>{product.name}</h3>
              {product.location && <span className="location-text"><PinIcon /> {product.location}</span>}
              <RatingSummary average={product.ratingAverage} count={product.ratingCount} compact />
              <p className="summary-description">{product.description}</p>
              {product.features?.length > 0 && (
                <ul className="summary-features" aria-label="Información destacada">
                  {product.features.slice(0, 6).map((f) => (
                    <li key={f.id}><FeatureIcon icon={f.icon} size={18} /> {f.name}</li>
                  ))}
                </ul>
              )}
              {product.policies?.length > 0 && (
                <details className="summary-policies">
                  <summary>Políticas del producto</summary>
                  {product.policies.map((p, i) => <p key={i}><strong>{p.title}:</strong> {p.description}</p>)}
                </details>
              )}
            </div>
            <div className="summary-dates">
              <div><span>Entrada</span><strong>{range.start ? formatLong(range.start) : '—'}</strong></div>
              <div><span>Salida</span><strong>{range.end ? formatLong(range.end) : '—'}</strong></div>
              <div><span>Noches</span><strong>{nights || '—'}</strong></div>
            </div>
            {submitError && <p className="reservation-error" role="alert">{submitError}</p>}
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? 'Confirmando...' : 'Confirmar reserva'}
            </button>
            <p className="muted small-print">Recibirás un correo con los datos de tu reserva en {user.email}.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
