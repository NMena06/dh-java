import { Link } from 'react-router-dom';

export default function AdminPanel() {
  return (
    <section className="admin-panel">
      <h1>Panel de administración</h1>
      <nav className="admin-menu">
        <Link to="/administracion/productos/nuevo" className="btn btn-primary">Agregar producto</Link>
        <Link to="/administracion/productos" className="btn btn-primary">Lista de productos</Link>
      </nav>
    </section>
  );
}
