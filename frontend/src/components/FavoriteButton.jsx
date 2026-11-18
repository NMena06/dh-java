import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';

/**
 * Corazón para marcar/desmarcar favorito con un clic (historia #24).
 * Sin sesión, lleva al login y vuelve a la página actual.
 */
export default function FavoriteButton({ product, className = '' }) {
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const active = isAuthenticated && isFavorite(product.id);

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname, reason: 'favoritos' } });
      return;
    }
    setBusy(true);
    setError(false);
    try {
      await toggle(product);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const label = active ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`;

  return (
    <button
      type="button"
      className={`fav-btn ${active ? 'active' : ''} ${error ? 'error' : ''} ${className}`}
      onClick={handleClick}
      disabled={busy}
      aria-pressed={active}
      aria-label={label}
      title={error ? 'No se pudo actualizar. Intenta de nuevo.' : label}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 6.9 4.5c2.1 0 3.6 1.2 5.1 3 1.5-1.8 3-3 5.1-3 3.5 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
