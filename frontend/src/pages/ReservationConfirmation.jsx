import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getReservation } from '../services/reservationService.js';
import { formatLong, fromISO } from '../utils/dates.js';
import ReservationDetails from '../components/ReservationDetails.jsx';

/** Página de confirmación (historia #32): indica que la reserva se realizó con éxito y muestra todos sus datos. */
export default function ReservationConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const [reservation, setReservation] = useState(location.state?.reservation ?? null);
  const [error, setError] = useState('');
  const justCreated = Boolean(location.state?.reservation);

  useEffect(() => {
    if (reservation && String(reservation.id) === id) return;
    getReservation(id).then(setReservation).catch((err) => setError(err.message));
  }, [id, reservation]);

  if (error) {
    return (
      <div className="page-padding">
        <p className="error-text">{error}</p>
        <Link to="/mis-reservas">Ver mis reservas</Link>
      </div>
    );
  }
  if (!reservation) return <p className="page-padding">Cargando reserva...</p>;

  return (
    <section className="confirmation-page">
      <div className="confirmation-card">
        {justCreated && <div className="success-icon" aria-hidden="true">✓</div>}
        <h1>{justCreated ? '¡Reserva realizada con éxito!' : 'Detalle de la reserva'}</h1>
        <p className="confirmation-lead">
          Tu reserva de <strong>{reservation.product.name}</strong> del{' '}
          <strong>{formatLong(fromISO(reservation.startDate))}</strong> al{' '}
          <strong>{formatLong(fromISO(reservation.endDate))}</strong> {reservation.status === 'COMPLETED' ? 'ya finalizó.' : 'está confirmada.'}
        </p>
        <p className="reservation-code">Código de reserva <strong>{reservation.code}</strong></p>
        {justCreated && <p className="muted">Te enviamos un correo a <strong>{reservation.userEmail}</strong> con todos los datos.</p>}

        <ReservationDetails reservation={reservation} />

        <div className="confirmation-actions">
          <Link to="/mis-reservas" className="btn btn-primary">Ver mis reservas</Link>
          <Link to="/" className="btn btn-outline-dark">Volver al inicio</Link>
        </div>
      </div>
    </section>
  );
}
