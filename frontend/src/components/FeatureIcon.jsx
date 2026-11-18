/**
 * Iconos de caracteristicas (historias #17 y #18). El backend guarda solo la clave (por ejemplo "wifi")
 * y aqui se dibuja el SVG. Todos usan trazo con currentColor sobre una grilla de 24x24.
 */
const ICONS = {
  wifi: (
    <>
      <path d="M2.5 9a14 14 0 0 1 19 0" />
      <path d="M5.5 12.5a9.5 9.5 0 0 1 13 0" />
      <path d="M8.5 16a5 5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" />
    </>
  ),
  cocina: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M4 9h16" />
      <circle cx="8.5" cy="6" r="0.8" fill="currentColor" />
      <circle cx="12" cy="6" r="0.8" fill="currentColor" />
      <rect x="7.5" y="12" width="9" height="6" rx="1" />
    </>
  ),
  televisor: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M8 21h8M9 2l3 4 3-4" />
    </>
  ),
  aire: (
    <>
      <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" />
      <path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5" />
    </>
  ),
  mascotas: (
    <>
      <circle cx="5.5" cy="10" r="2" />
      <circle cx="9.5" cy="5.5" r="2" />
      <circle cx="14.5" cy="5.5" r="2" />
      <circle cx="18.5" cy="10" r="2" />
      <path d="M12 12c-3 0-5.5 3.5-5.5 6a2.5 2.5 0 0 0 3 2.4c1-.2 1.7-.6 2.5-.6s1.5.4 2.5.6a2.5 2.5 0 0 0 3-2.4c0-2.5-2.5-6-5.5-6z" />
    </>
  ),
  estacionamiento: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M9.5 17V7h3.5a3 3 0 0 1 0 6H9.5" />
    </>
  ),
  pileta: (
    <>
      <path d="M2 18c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
      <path d="M8 14.5V5a2 2 0 0 1 4 0M16 14.5V5a2 2 0 0 0-4 0M8 8h8M8 11.5h8" />
    </>
  ),
  desayuno: (
    <>
      <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z" />
      <path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M7 2.5c0 1.5 1 1.5 1 3M11 2.5c0 1.5 1 1.5 1 3" />
    </>
  ),
  equipaje: (
    <>
      <rect x="5" y="7" width="14" height="13" rx="2" />
      <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7M9 11v5M15 11v5M8 20v1.5M16 20v1.5" />
    </>
  ),
  auto: (
    <>
      <path d="M5 16V11l2-5h10l2 5v5" />
      <path d="M3 16h18v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2zM5 11h14" />
      <circle cx="7.5" cy="13.5" r="0.8" fill="currentColor" />
      <circle cx="16.5" cy="13.5" r="0.8" fill="currentColor" />
    </>
  ),
  gimnasio: (
    <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
  ),
  calefaccion: (
    <path d="M12 3c1 3 4 4.5 4 9a4 4 0 0 1-8 0c0-2 1-3 1.5-4 .5 1.5 1.5 2 2 2-.5-2 0-4.5.5-7zM6 21h12" />
  ),
  accesorios: (
    <>
      <path d="M12 4l2.5 5 5.5.8-4 3.9.9 5.5L12 16.6l-4.9 2.6.9-5.5-4-3.9 5.5-.8z" />
    </>
  ),
  check: <path d="M4 12.5l5 5L20 6.5" />,
};

/** Opciones para el selector del panel de administracion. */
export const ICON_OPTIONS = [
  { value: 'wifi', label: 'Wifi' },
  { value: 'cocina', label: 'Cocina' },
  { value: 'televisor', label: 'Televisor' },
  { value: 'aire', label: 'Aire acondicionado' },
  { value: 'mascotas', label: 'Mascotas' },
  { value: 'estacionamiento', label: 'Estacionamiento' },
  { value: 'pileta', label: 'Pileta' },
  { value: 'desayuno', label: 'Desayuno' },
  { value: 'equipaje', label: 'Equipaje' },
  { value: 'auto', label: 'Auto' },
  { value: 'gimnasio', label: 'Gimnasio' },
  { value: 'calefaccion', label: 'Calefacción' },
  { value: 'accesorios', label: 'Accesorios' },
  { value: 'check', label: 'Genérico' },
];

export default function FeatureIcon({ icon, size = 22, title }) {
  const content = ICONS[icon] ?? ICONS.check;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
      className="feature-icon"
    >
      {content}
    </svg>
  );
}
