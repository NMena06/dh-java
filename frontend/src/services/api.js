const SESSION_KEY = 'reservaya.session';

export function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // almacenamiento no disponible (modo privado): la sesion dura lo que la pestaña
  }
}

/** Error de API con el estado HTTP y los errores por campo devueltos por el backend. */
export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * fetch con JSON y el token de sesion. Si el backend responde 401 con un token enviado,
 * la sesion vencio o se cerro: se avisa a la app para que vuelva a modo anonimo.
 */
export async function request(url, options = {}) {
  const session = readSession();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let message = 'Ocurrió un error inesperado';
    let fieldErrors = {};
    try {
      const data = await response.json();
      if (data.message) message = data.message;
      if (data.errors) fieldErrors = data.errors;
    } catch {
      // respuesta sin cuerpo JSON
    }
    if (response.status === 401 && session?.token) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    throw new ApiError(message, response.status, fieldErrors);
  }

  if (response.status === 204) return null;
  return response.json();
}
