import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000').replace(/[^\d]/g, '');
const APP_NAME = import.meta.env.VITE_APP_NAME || 'ReservaYa';

/** Un número internacional de WhatsApp tiene entre 10 y 15 dígitos (con código de país). */
export const isValidWhatsAppNumber = (n) => /^\d{10,15}$/.test(n);

export const whatsappUrl = (number, message) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

/**
 * Botón flotante de WhatsApp (historia #34), abajo a la derecha en todas las páginas y resoluciones.
 * No requiere sesión. Abre una ventana para escribir la consulta y la envía a WhatsApp (web o app).
 * - Éxito: confirma que se abrió WhatsApp con el mensaje.
 * - Errores: número no válido, sin conexión o ventana bloqueada, con un mensaje claro y qué hacer.
 * - Privacidad: el mensaje no pasa por nuestros servidores ni se guarda.
 */
export default function WhatsAppButton() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', text }
  const textRef = useRef(null);

  // Si se abre desde un producto, el mensaje lo menciona
  useEffect(() => {
    if (!open) return;
    const productName = document.querySelector('.product-detail .detail-title h1, .reservation-page .detail-title h1')?.textContent;
    setMessage(productName
      ? `Hola, tengo una consulta sobre "${productName}" que vi en ${APP_NAME}.`
      : `Hola, tengo una consulta sobre ${APP_NAME}.`);
    setStatus(null);
    setTimeout(() => textRef.current?.focus(), 0);
  }, [open, location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (location.pathname.startsWith('/administracion')) return null;

  const send = () => {
    if (!message.trim()) {
      setStatus({ type: 'error', text: 'Escribe tu consulta antes de enviarla.' });
      return;
    }
    if (!isValidWhatsAppNumber(NUMBER)) {
      setStatus({ type: 'error', text: 'El número de contacto de WhatsApp no es válido. Escríbenos a contacto@reservaya.com mientras lo solucionamos.' });
      return;
    }
    if (!navigator.onLine) {
      setStatus({ type: 'error', text: 'No hay conexión a internet. Revisa tu conexión y vuelve a intentarlo.' });
      return;
    }
    const url = whatsappUrl(NUMBER, message.trim());
    const win = window.open(url, '_blank');
    if (!win) {
      setStatus({ type: 'error', text: 'Tu navegador bloqueó la ventana de WhatsApp. Permite las ventanas emergentes o usa el enlace:', url });
      return;
    }
    win.opener = null; // la pestaña de WhatsApp no puede acceder a esta página
    setStatus({ type: 'success', text: '¡Listo! Abrimos WhatsApp con tu mensaje. Toca "Enviar" allí para que llegue al proveedor.' });
  };

  return (
    <div className="wa-widget">
      {open && (
        <div className="wa-panel" role="dialog" aria-modal="false" aria-labelledby="wa-title">
          <div className="wa-header">
            <WhatsAppIcon size={26} />
            <div>
              <strong id="wa-title">Consultas por WhatsApp</strong>
              <span>Te responde el proveedor del producto</span>
            </div>
            <button type="button" className="wa-close" onClick={() => setOpen(false)} aria-label="Cerrar">×</button>
          </div>
          <div className="wa-body">
            <label htmlFor="wa-message">Tu mensaje</label>
            <textarea id="wa-message" ref={textRef} rows={4} maxLength={500} value={message}
              onChange={(e) => { setMessage(e.target.value); setStatus(null); }} />
            {status && (
              <p className={status.type === 'success' ? 'wa-status success' : 'wa-status error'} role={status.type === 'error' ? 'alert' : 'status'}>
                {status.text}
                {status.url && <> <a href={status.url} target="_blank" rel="noopener noreferrer">abrir WhatsApp</a>.</>}
              </p>
            )}
            <button type="button" className="btn wa-send" onClick={send}>
              <WhatsAppIcon size={18} /> Enviar por WhatsApp
            </button>
            <p className="wa-privacy">
              Tu mensaje se envía directamente desde WhatsApp. {APP_NAME} no lo guarda ni lo comparte con terceros.
            </p>
          </div>
        </div>
      )}
      <button type="button" className="wa-fab" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        aria-label={open ? 'Cerrar chat de WhatsApp' : 'Contactar por WhatsApp'} title="Contactar por WhatsApp">
        <WhatsAppIcon size={30} />
      </button>
    </div>
  );
}

function WhatsAppIcon({ size }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path fill="currentColor" d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.6 21.5l4.9-1.3A9.4 9.4 0 1 0 12 2.5zm0 17.1a7.7 7.7 0 0 1-4-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A7.7 7.7 0 1 1 12 19.6zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.3 6.3 0 0 1-3.1-2.7c-.2-.4.2-.4.7-1.2.1-.1 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2c0 1.2.9 2.3 1 2.5.1.2 1.7 2.6 4.1 3.6 1.5.7 2.1.7 2.9.6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2z" />
    </svg>
  );
}
