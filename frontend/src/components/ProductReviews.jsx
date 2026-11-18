import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getReviewEligibility, getReviews, rateProduct } from '../services/searchService.js';
import { RatingSummary, StarInput, Stars } from './StarRating.jsx';

const NEEDS_RESERVATION = 'Solo pueden valorar los usuarios con una reserva finalizada de este producto.';

/**
 * Valoraciones (historia #28): media y cantidad, listado de reseñas (estrellas, nombre, fecha, comentario)
 * y formulario para quien tiene una reserva finalizada. onRated(summary) avisa al detalle para actualizar la media.
 */
export default function ProductReviews({ productId, onRated }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [summary, setSummary] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    setError('');
    Promise.all([getReviews(productId), getReviewEligibility(productId)])
      .then(([s, e]) => {
        setSummary(s);
        setEligibility(e);
        if (e.myReview) {
          setRating(e.myReview.rating);
          setComment(e.myReview.comment ?? '');
        }
      })
      .catch(() => setError('No pudimos cargar las valoraciones.'));
  }, [productId]);

  useEffect(() => {
    load();
  }, [load, isAuthenticated]);

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSaved(false);
    if (!rating) {
      setFormError('Elige de 1 a 5 estrellas');
      return;
    }
    setSaving(true);
    try {
      const updated = await rateProduct(productId, rating, comment);
      setSummary(updated);
      getReviewEligibility(productId).then(setEligibility).catch(() => {});
      setSaved(true);
      onRated?.(updated);
    } catch (err) {
      setFormError(err.status === 403 ? NEEDS_RESERVATION : err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="product-reviews" aria-labelledby="reviews-title">
      <div className="reviews-header">
        <h2 id="reviews-title">Valoraciones</h2>
        {summary && (
          <div className="reviews-score">
            <span className="score-number">{summary.count ? summary.average.toFixed(1) : '—'}</span>
            <RatingSummary average={summary.average} count={summary.count} />
          </div>
        )}
      </div>

      {error && (
        <p className="error-text" role="alert">{error} <button type="button" className="link-button" onClick={load}>Reintentar</button></p>
      )}

      {eligibility && !eligibility.authenticated && (
        <p className="info-text">
          <Link to="/login" state={{ from: location.pathname }}>Inicia sesión</Link> para valorar este producto.
        </p>
      )}
      {eligibility?.authenticated && !eligibility.canReview && (
        <p className="info-text">{NEEDS_RESERVATION}</p>
      )}
      {eligibility?.canReview && (
        <form className="review-form" onSubmit={submit} noValidate>
          <h3>{eligibility.myReview ? 'Editar tu valoración' : 'Deja tu valoración'}</h3>
          <StarInput value={rating} onChange={setRating} />
          <label htmlFor="review-comment">Comentario (opcional)</label>
          <textarea id="review-comment" rows={3} maxLength={1000} value={comment}
            placeholder="Cuéntanos cómo fue tu experiencia" onChange={(e) => setComment(e.target.value)} />
          {formError && <p className="error-text" role="alert">{formError}</p>}
          {saved && <p className="success-text" role="status">¡Gracias! Tu valoración fue publicada.</p>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Publicando...' : 'Publicar valoración'}
          </button>
        </form>
      )}

      {summary && summary.reviews.length > 0 && (
        <ul className="review-list">
          {summary.reviews.map((review) => (
            <li key={review.id} className="review">
              <div className="review-top">
                <span className="avatar avatar-sm" aria-hidden="true">
                  {review.userName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                <div>
                  <strong className="review-name">{review.userName}</strong>
                  <time dateTime={review.createdAt} className="review-date">
                    {new Date(review.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                </div>
                <span className="review-stars" aria-label={`${review.rating} de 5 estrellas`}><Stars value={review.rating} /></span>
              </div>
              {review.comment && <p className="review-comment">{review.comment}</p>}
            </li>
          ))}
        </ul>
      )}
      {summary && summary.reviews.length === 0 && <p className="muted">Todavía nadie valoró este producto.</p>}
    </section>
  );
}
