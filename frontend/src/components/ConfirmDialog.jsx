import { useEffect, useRef } from 'react';

/**
 * Ventana de confirmación con botones "Cancelar" y "Confirmar" (historia #29).
 * El foco arranca en "Cancelar" para evitar confirmaciones accidentales; Escape cancela.
 */
export default function ConfirmDialog({ title, children, confirmLabel = 'Confirmar', danger = false, busy = false, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && !busy && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel, busy]);

  return (
    <div className="modal-overlay" onClick={() => !busy && onCancel()}>
      <div className="modal confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"
        aria-describedby="confirm-body" onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-title">{title}</h3>
        <div id="confirm-body" className="confirm-body">{children}</div>
        <div className="modal-actions">
          <button type="button" ref={cancelRef} className="btn btn-outline-dark" onClick={onCancel} disabled={busy}>Cancelar</button>
          <button type="button" className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
