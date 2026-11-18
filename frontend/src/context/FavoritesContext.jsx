import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { addFavorite, getFavorites, removeFavorite } from '../services/searchService.js';

const FavoritesContext = createContext(null);

/**
 * Favoritos del usuario (historias #24 y #25). Un unico estado compartido por toda la app:
 * marcar o desmarcar desde el home, el detalle o "Mis favoritos" actualiza todas las vistas al instante.
 * La actualizacion es optimista y se revierte si el servidor falla.
 */
export function FavoritesProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!isAuthenticated) {
      setFavorites([]);
      return Promise.resolve();
    }
    setLoading(true);
    setError('');
    return getFavorites()
      .then(setFavorites)
      .catch(() => setError('No pudimos cargar tus favoritos.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load, user?.id]);

  const ids = useMemo(() => new Set(favorites.map((p) => p.id)), [favorites]);

  const toggle = useCallback(async (product) => {
    const wasFavorite = ids.has(product.id);
    setFavorites((prev) => (wasFavorite ? prev.filter((p) => p.id !== product.id) : [product, ...prev]));
    try {
      if (wasFavorite) await removeFavorite(product.id);
      else await addFavorite(product.id);
      return !wasFavorite;
    } catch (err) {
      setFavorites((prev) => (wasFavorite ? [product, ...prev] : prev.filter((p) => p.id !== product.id)));
      throw err;
    }
  }, [ids]);

  const value = useMemo(
    () => ({ favorites, isFavorite: (id) => ids.has(id), toggle, loading, error, reload: load }),
    [favorites, ids, toggle, loading, error, load]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites debe usarse dentro de FavoritesProvider');
  return ctx;
}
