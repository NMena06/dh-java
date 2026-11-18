import { useEffect, useRef, useState } from 'react';

const NETWORKS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'instagram', label: 'Instagram' },
];

/** URL de cada red social con el mensaje y el enlace al producto. */
export function shareUrl(network, url, message) {
  const u = encodeURIComponent(url);
  const m = encodeURIComponent(message);
  switch (network) {
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${m}`;
    case 'twitter': return `https://twitter.com/intent/tweet?text=${m}&url=${u}`;
    case 'whatsapp': return `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`;
    default: return 'https://www.instagram.com/';
  }
}

/**
 * Ventana para compartir un producto (historia #27): imagen, descripción breve, enlace directo,
 * elección de red social y mensaje personalizado. Facebook, X y WhatsApp abren su página de compartir
 * con el contenido. Instagram no permite compartir enlaces desde la web: se copia el texto y se abre Instagram.
 */
export default function ShareModal({ product, onClose }) {
  const link = `${window.location.origin}/productos/${product.id}`;
  const short = product.description.length > 140 ? `${product.description.slice(0, 137)}...` : product.description;
  const [network, setNetwork] = useState('facebook');
  const [message, setMessage] = useState(`Mira este producto en ReservaYa: ${product.name}`);
  const [notice, setNotice] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const share = async () => {
    if (network === 'instagram') {
      const ok = await copy(`${message}\n${link}`);
      setNotice(ok
        ? 'Copiamos el mensaje y el enlace. Pégalo en tu historia o publicación de Instagram.'
        : 'Copia el enlace y pégalo en Instagram.');
    }
    window.open(shareUrl(network, link, message), '_blank', 'noopener,noreferrer,width=640,height=560');
  };

  const copyLink = async () => {
    setNotice((await copy(link)) ? 'Enlace copiado al portapapeles.' : 'No se pudo copiar. Selecciona el enlace manualmente.');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title"
        tabIndex={-1} ref={dialogRef} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="share-title">Compartir producto</h3>
          <button type="button" className="icon-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="share-preview">
          {product.images?.[0] && <img src={product.images[0]} alt={product.name} />}
          <div>
            <strong>{product.name}</strong>
            <p>{short}</p>
            <div className="share-link">
              <input type="text" readOnly value={link} aria-label="Enlace al producto" onFocus={(e) => e.target.select()} />
              <button type="button" className="btn btn-outline-dark btn-sm" onClick={copyLink}>Copiar enlace</button>
            </div>
          </div>
        </div>

        <fieldset className="share-networks">
          <legend>Elige dónde compartir</legend>
          {NETWORKS.map((n) => (
            <label key={n.id} className={`network-option ${n.id} ${network === n.id ? 'selected' : ''}`}>
              <input type="radio" name="network" value={n.id} checked={network === n.id} onChange={() => setNetwork(n.id)} />
              <NetworkIcon id={n.id} />
              <span>{n.label}</span>
            </label>
          ))}
        </fieldset>

        <label className="share-message-label" htmlFor="share-message">Mensaje personalizado</label>
        <textarea id="share-message" rows={3} maxLength={280} value={message} onChange={(e) => setMessage(e.target.value)} />
        <small className="muted">{message.length}/280</small>

        {notice && <p className="success-text" role="status">{notice}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline-dark" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={share}>
            Compartir en {NETWORKS.find((n) => n.id === network).label}
          </button>
        </div>
      </div>
    </div>
  );
}

function NetworkIcon({ id }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', 'aria-hidden': true };
  if (id === 'facebook') {
    return <svg {...common}><path fill="currentColor" d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" /></svg>;
  }
  if (id === 'twitter') {
    return <svg {...common}><path fill="currentColor" d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.3l4.4 5.9L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" /></svg>;
  }
  if (id === 'whatsapp') {
    return <svg {...common}><path fill="currentColor" d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.6 21.5l4.9-1.3A9.4 9.4 0 1 0 12 2.5zm0 17.1a7.7 7.7 0 0 1-4-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A7.7 7.7 0 1 1 12 19.6zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.3 6.3 0 0 1-3.1-2.7c-.2-.4.2-.4.7-1.2.1-.1 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2c0 1.2.9 2.3 1 2.5.1.2 1.7 2.6 4.1 3.6 1.5.7 2.1.7 2.9.6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2z" /></svg>;
  }
  return <svg {...common}><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" /></svg>;
}
