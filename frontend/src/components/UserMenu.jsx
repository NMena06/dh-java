import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { initialsOf, useAuth } from '../context/AuthContext.jsx';

/**
 * Usuario identificado (historias #14 y #15): avatar con iniciales y nombre.
 * Al hacer clic se despliega, debajo del avatar, el menu con "Cerrar sesión".
 */
export default function UserMenu() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="avatar" aria-hidden="true">{initialsOf(user)}</span>
        <span className="user-name">{fullName}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className={open ? 'chev open' : 'chev'}>
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="user-dropdown" role="menu">
          <div className="user-dropdown-head">
            <strong>{fullName}</strong>
            <span>{user.email}</span>
            {isAdmin && <span className="role-badge">Administrador</span>}
          </div>
          <Link to="/mi-cuenta" role="menuitem" onClick={() => setOpen(false)}>Mi cuenta</Link>
          <Link to="/mis-reservas" role="menuitem" onClick={() => setOpen(false)}>Mis reservas</Link>
          <Link to="/favoritos" role="menuitem" onClick={() => setOpen(false)}>Mis favoritos</Link>
          {isAdmin && (
            <Link to="/administracion" role="menuitem" onClick={() => setOpen(false)}>Panel de administración</Link>
          )}
          <button type="button" role="menuitem" className="logout-item" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
