import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toSpanish, validateEmail } from '../utils/validation.js';

/** Inicio de sesion con correo y contrasena (historia #14). */
export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const emailError = validateEmail(email);
    if (emailError) return setError(emailError);
    if (!password) return setError('La contraseña es obligatoria');

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      setError(
        err.status === 401
          ? 'Correo electrónico o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.'
          : toSpanish(err.message)
      );
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Iniciar sesión</h1>
        {location.state?.from && (
          <p className="info-text">
            {location.state.reason === 'favoritos' ? 'Inicia sesión para guardar tus favoritos.' : 'Inicia sesión para continuar.'}
          </p>
        )}

        <div className="field">
          <label htmlFor="login-email">Correo electrónico</label>
          <input id="login-email" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="login-password">Contraseña</label>
          <input id="login-password" type="password" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="error-text login-error" role="alert">{error}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
        <p className="auth-switch">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </form>
    </section>
  );
}
