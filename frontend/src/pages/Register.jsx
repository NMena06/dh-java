import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { register, resendConfirmation } from '../services/authService.js';
import { toSpanish, validateRegistration } from '../utils/validation.js';

const EMPTY = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' };

/**
 * Registro de usuario (historia #13) con validacion en el navegador y en el backend.
 * Al terminar muestra la confirmacion y la opcion de reenviar el correo (historia #19).
 */
export default function Register() {
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(null);
  const [resendState, setResendState] = useState('');

  if (isAuthenticated && !registered) return <Navigate to="/" replace />;

  const update = (field) => (event) => {
    const next = { ...form, [field]: event.target.value };
    setForm(next);
    if (touched[field] || errors[field]) setErrors(validateRegistration(next));
  };

  const blur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validateRegistration(form));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    const found = validateRegistration(form);
    setErrors(found);
    setTouched({ firstName: true, lastName: true, email: true, password: true, confirmPassword: true });
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const user = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setRegistered(user);
    } catch (err) {
      const fieldErrors = Object.fromEntries(
        Object.entries(err.fieldErrors || {}).map(([k, v]) => [k, toSpanish(v)])
      );
      if (err.status === 409) fieldErrors.email = toSpanish(err.message);
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) setServerError(toSpanish(err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResendState('sending');
    try {
      await resendConfirmation(registered.email);
      setResendState('sent');
    } catch {
      setResendState('error');
    }
  };

  if (registered) {
    return (
      <section className="auth-page">
        <div className="auth-card success-card" role="status">
          <div className="success-icon" aria-hidden="true">✓</div>
          <h1>¡Registro exitoso!</h1>
          <p>
            Hola <strong>{registered.firstName}</strong>, tu cuenta fue creada. Te enviamos un correo de confirmación a{' '}
            <strong>{registered.email}</strong>.
          </p>
          <Link to="/login" state={{ email: registered.email }} className="btn btn-primary btn-block">
            Iniciar sesión
          </Link>
          <div className="resend">
            <span>¿No te llegó el correo?</span>
            <button type="button" className="link-button" onClick={handleResend} disabled={resendState === 'sending'}>
              {resendState === 'sending' ? 'Reenviando...' : 'Reenviar correo de confirmación'}
            </button>
            {resendState === 'sent' && <p className="success-text">Te reenviamos el correo de confirmación.</p>}
            {resendState === 'error' && <p className="error-text">No se pudo reenviar. Intenta más tarde.</p>}
          </div>
        </div>
      </section>
    );
  }

  const fieldError = (field) => (touched[field] || errors[field]) && errors[field];

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Crear cuenta</h1>
        <p className="muted">Regístrate para reservar más rápido y ver tus datos.</p>

        <div className="form-row">
          <Field label="Nombre" id="firstName" error={fieldError('firstName')}>
            <input id="firstName" type="text" autoComplete="given-name" value={form.firstName}
              onChange={update('firstName')} onBlur={blur('firstName')} maxLength={50}
              aria-invalid={Boolean(fieldError('firstName'))} aria-describedby="firstName-error" />
          </Field>
          <Field label="Apellido" id="lastName" error={fieldError('lastName')}>
            <input id="lastName" type="text" autoComplete="family-name" value={form.lastName}
              onChange={update('lastName')} onBlur={blur('lastName')} maxLength={50}
              aria-invalid={Boolean(fieldError('lastName'))} aria-describedby="lastName-error" />
          </Field>
        </div>

        <Field label="Correo electrónico" id="email" error={fieldError('email')}>
          <input id="email" type="email" autoComplete="email" value={form.email}
            onChange={update('email')} onBlur={blur('email')} maxLength={120}
            aria-invalid={Boolean(fieldError('email'))} aria-describedby="email-error" />
        </Field>

        <Field label="Contraseña" id="password" error={fieldError('password')}
          hint="Mínimo 8 caracteres, con al menos una letra y un número.">
          <div className="password-wrap">
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
              value={form.password} onChange={update('password')} onBlur={blur('password')} maxLength={64}
              aria-invalid={Boolean(fieldError('password'))} aria-describedby="password-error password-hint" />
            <button type="button" className="toggle-password" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </Field>

        <Field label="Repetir contraseña" id="confirmPassword" error={fieldError('confirmPassword')}>
          <input id="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
            value={form.confirmPassword} onChange={update('confirmPassword')} onBlur={blur('confirmPassword')}
            maxLength={64} aria-invalid={Boolean(fieldError('confirmPassword'))} aria-describedby="confirmPassword-error" />
        </Field>

        {serverError && <p className="error-text" role="alert">{serverError}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </section>
  );
}

function Field({ label, id, error, hint, children }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <small id={`${id}-hint`} className="field-hint">{hint}</small>}
      {error && <small id={`${id}-error`} className="field-error" role="alert">{error}</small>}
    </div>
  );
}
