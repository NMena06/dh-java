import { formatLong, fromISO } from '../utils/dates.js';

/** Datos de una reserva, incluidos los opcionales que completó el usuario (historia #32). */
export default function ReservationDetails({ reservation: r }) {
  const created = r.createdAt
    ? new Date(r.createdAt).toLocaleString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;
  return (
    <div className="reservation-details">
      <dl>
        <dt>Producto</dt><dd>{r.product.name}</dd>
        {r.product.location && <><dt>Ubicación</dt><dd>{r.product.location}</dd></>}
        <dt>Entrada</dt><dd>{formatLong(fromISO(r.startDate))}</dd>
        <dt>Salida</dt><dd>{formatLong(fromISO(r.endDate))}</dd>
        <dt>Noches</dt><dd>{r.nights}</dd>
        <dt>Titular</dt><dd>{r.userName} · {r.userEmail}</dd>
        {r.guests != null && <><dt>Personas</dt><dd>{r.guests}</dd></>}
        {r.phone && <><dt>Teléfono</dt><dd>{r.phone}</dd></>}
        {r.comments && <><dt>Comentarios</dt><dd>{r.comments}</dd></>}
        {created && <><dt>Reserva realizada</dt><dd>{created}</dd></>}
      </dl>
      <div className="provider-box">
        <strong>Contacto del proveedor</strong>
        <span>{r.provider.name}</span>
        <span>{r.provider.email} · {r.provider.phone}</span>
      </div>
    </div>
  );
}
