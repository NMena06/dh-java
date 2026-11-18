import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { changeUserRole, getUsers } from '../../services/authService.js';
import { useAuth } from '../../context/AuthContext.jsx';

/** Historia #16: añadir o quitar el permiso de administrador desde el listado de usuarios. */
export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleAdmin = async (user) => {
    const makeAdmin = user.role !== 'ADMIN';
    const question = makeAdmin
      ? `¿Otorgar permisos de administrador a ${user.firstName} ${user.lastName}?`
      : `¿Quitar los permisos de administrador a ${user.firstName} ${user.lastName}?`;
    if (!window.confirm(question)) return;

    setError('');
    setNotice('');
    setSavingId(user.id);
    try {
      const updated = await changeUserRole(user.id, makeAdmin ? 'ADMIN' : 'USER');
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setNotice(makeAdmin ? `${user.firstName} ahora es administrador.` : `${user.firstName} ya no es administrador.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section>
      <div className="admin-toolbar">
        <h1>Usuarios registrados</h1>
        <Link to="/administracion" className="btn btn-outline-dark">Volver al panel</Link>
      </div>

      {loading && <p>Cargando usuarios...</p>}
      {error && <p className="error-text" role="alert">{error}</p>}
      {notice && <p className="success-text" role="status">{notice}</p>}

      {!loading && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Nombre</th>
              <th>Correo electrónico</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUser?.id;
              return (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.firstName} {user.lastName}{isSelf && ' (tú)'}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={user.role === 'ADMIN' ? 'role-badge' : 'role-badge role-user'}>
                      {user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={user.role === 'ADMIN' ? 'btn btn-danger' : 'btn btn-primary'}
                      onClick={() => toggleAdmin(user)}
                      disabled={isSelf || savingId === user.id}
                      title={isSelf ? 'No puedes modificar tus propios permisos' : undefined}
                    >
                      {user.role === 'ADMIN' ? 'Quitar administrador' : 'Hacer administrador'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
