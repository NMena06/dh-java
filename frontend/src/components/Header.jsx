import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import UserMenu from './UserMenu.jsx';

export default function Header() {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="brand" aria-label="ReservaYa - Inicio">
          <img src="/logo.svg" alt="ReservaYa" className="brand-logo" />
          <span className="brand-slogan">Tu próxima reserva, a un clic</span>
        </Link>
      </div>
      <div className="header-right">
        {isAuthenticated && user ? (
          <UserMenu />
        ) : (
          <>
            <Link to="/registro" className="btn btn-outline">Crear cuenta</Link>
            <Link to="/login" className="btn btn-primary">Iniciar sesión</Link>
          </>
        )}
      </div>
    </header>
  );
}
