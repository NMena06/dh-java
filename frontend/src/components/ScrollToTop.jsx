import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Al cambiar de página, vuelve al inicio (salvo enlaces a un ancla #). */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
