import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Solo usuarios autenticados. Si no hay sesion, redirige al login y vuelve despues. */
export function RequireAuth({ children }) {
  const { isAuthenticated, checking } = useAuth();
  const location = useLocation();

  if (checking) return <p className="page-padding">Verificando sesión...</p>;
  if (!isAuthenticated) {
    const from = location.pathname + location.search;
    const reason = location.pathname.endsWith('/reservar') ? 'reserva' : undefined;
    return <Navigate to="/login" replace state={{ from, reason }} />;
  }
  return children;
}

/** Solo administradores (historia #16). Un usuario comun ve un aviso de acceso denegado. */
export function RequireAdmin({ children }) {
  const { isAuthenticated, isAdmin, checking } = useAuth();
  const location = useLocation();

  if (checking) return <p className="page-padding">Verificando sesión...</p>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) {
    return (
      <div className="page-padding access-denied">
        <h1>Acceso denegado</h1>
        <p>Necesitas permisos de administrador para ver esta sección.</p>
      </div>
    );
  }
  return children;
}
