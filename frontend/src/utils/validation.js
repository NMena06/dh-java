// Mismas reglas que el backend (RegisterRequest.java), para avisar antes de enviar.
const NAME_REGEX = /^\s*\p{L}+(?:[ '-]\p{L}+)*\s*$/u;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function validateName(value, label) {
  const trimmed = value.trim();
  if (!trimmed) return `El ${label} es obligatorio`;
  if (trimmed.length < 2 || trimmed.length > 50) return `El ${label} debe tener entre 2 y 50 caracteres`;
  if (!NAME_REGEX.test(trimmed)) return `El ${label} solo puede contener letras`;
  return '';
}

export function validateEmail(value) {
  const trimmed = value.trim();
  if (!trimmed) return 'El correo electrónico es obligatorio';
  if (trimmed.length > 120 || !EMAIL_REGEX.test(trimmed)) return 'El correo electrónico no es válido';
  return '';
}

export function validatePassword(value) {
  if (!value) return 'La contraseña es obligatoria';
  if (value.length < 8 || value.length > 64) return 'La contraseña debe tener entre 8 y 64 caracteres';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'La contraseña debe incluir al menos una letra y un número';
  return '';
}

export function validateRegistration(form) {
  const errors = {
    firstName: validateName(form.firstName, 'nombre'),
    lastName: validateName(form.lastName, 'apellido'),
    email: validateEmail(form.email),
    password: validatePassword(form.password),
    confirmPassword:
      form.confirmPassword !== form.password ? 'Las contraseñas no coinciden' : '',
  };
  return Object.fromEntries(Object.entries(errors).filter(([, msg]) => msg));
}

/** Traduce los mensajes del backend (sin tildes) a los mismos textos del formulario. */
export const FIELD_MESSAGES_FROM_API = {
  'El correo electronico no es valido': 'El correo electrónico no es válido',
  'El correo electronico es obligatorio': 'El correo electrónico es obligatorio',
  'La contrasena es obligatoria': 'La contraseña es obligatoria',
  'La contrasena debe tener entre 8 y 64 caracteres': 'La contraseña debe tener entre 8 y 64 caracteres',
  'La contrasena debe incluir al menos una letra y un numero': 'La contraseña debe incluir al menos una letra y un número',
  'Ya existe una cuenta registrada con ese correo electronico': 'Ya existe una cuenta registrada con ese correo electrónico',
  'Correo electronico o contrasena incorrectos': 'Correo electrónico o contraseña incorrectos',
};

export const toSpanish = (message) => FIELD_MESSAGES_FROM_API[message] ?? message;
