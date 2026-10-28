import { Outlet } from 'react-router-dom';

/**
 * Contenedor del panel de administracion.
 * No es responsive: en dispositivos moviles (<768px) se muestra un aviso
 * y el contenido del panel se oculta (ver CSS .admin-mobile-msg).
 */
export default function AdminLayout() {
  return (
    <div className="admin">
      <div className="admin-mobile-msg">
        <h2>Panel no disponible</h2>
        <p>El panel de administración no está disponible desde dispositivos móviles. Ingresa desde una computadora.</p>
      </div>
      <div className="admin-desktop">
        <Outlet />
      </div>
    </div>
  );
}
