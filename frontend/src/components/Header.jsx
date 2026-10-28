import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="brand" aria-label="ReservaYa - Inicio">
          <img src="/logo.svg" alt="ReservaYa" className="brand-logo" />
          <span className="brand-slogan">Tu próxima reserva, a un clic</span>
        </Link>
      </div>
      <div className="header-right">
        <button type="button" className="btn btn-outline">Crear cuenta</button>
        <button type="button" className="btn btn-primary">Iniciar sesión</button>
      </div>
    </header>
  );
}
