import { Link } from 'react-router-dom';
import { initialsOf, useAuth } from '../context/AuthContext.jsx';

/** Informacion personal, disponible solo con sesion iniciada (historia #14). */
export default function Profile() {
  const { user, isAdmin } = useAuth();
  const since = user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-AR') : '';

  return (
    <section className="profile-page">
      <div className="profile-card">
        <span className="avatar avatar-lg" aria-hidden="true">{initialsOf(user)}</span>
        <h1>{user.firstName} {user.lastName}</h1>
        {isAdmin && <span className="role-badge">Administrador</span>}
        <dl className="profile-data">
          <dt>Nombre</dt>
          <dd>{user.firstName}</dd>
          <dt>Apellido</dt>
          <dd>{user.lastName}</dd>
          <dt>Correo electrónico</dt>
          <dd>{user.email}</dd>
          {since && (
            <>
              <dt>Miembro desde</dt>
              <dd>{since}</dd>
            </>
          )}
        </dl>
        <div className="profile-actions">
          <Link to="/" className="btn btn-primary">Buscar reservas</Link>
          <Link to="/favoritos" className="btn btn-outline-dark">Mis favoritos</Link>
          {isAdmin && <Link to="/administracion" className="btn btn-outline-dark">Panel de administración</Link>}
        </div>
      </div>
    </section>
  );
}
