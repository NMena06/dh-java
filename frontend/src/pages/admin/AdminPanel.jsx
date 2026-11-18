import { Link } from 'react-router-dom';

const SECTIONS = [
  { to: '/administracion/productos/nuevo', label: 'Agregar producto', text: 'Registrar un nuevo producto' },
  { to: '/administracion/productos', label: 'Lista de productos', text: 'Editar, categorizar o eliminar' },
  { to: '/administracion/categorias/nueva', label: 'Agregar categoría', text: 'Título, descripción e imagen' },
  { to: '/administracion/categorias', label: 'Lista de categorías', text: 'Ver y eliminar categorías' },
  { to: '/administracion/caracteristicas', label: 'Administrar características', text: 'Nombre e ícono' },
  { to: '/administracion/usuarios', label: 'Usuarios', text: 'Otorgar o quitar permisos de administrador' },
];

export default function AdminPanel() {
  return (
    <section className="admin-panel">
      <h1>Panel de administración</h1>
      <nav className="admin-menu admin-menu-grid">
        {SECTIONS.map((section) => (
          <Link key={section.to} to={section.to} className="admin-tile">
            <strong>{section.label}</strong>
            <span>{section.text}</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
