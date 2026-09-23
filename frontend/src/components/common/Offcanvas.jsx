import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Offcanvas({
  open,
  onClose,
  title,
  children,
  side = 'start',
  className = '',
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => panelRef.current?.focus(), 30);

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
      clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="modal-backdrop fade show" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`offcanvas offcanvas-${side} show ${className}`}
        style={{ visibility: 'visible', transform: 'none' }}
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">{title}</h5>
          <button
            type="button"
            className="btn-close"
            aria-label="Close panel"
            onClick={onClose}
          />
        </div>
        <div className="offcanvas-body">{children}</div>
      </div>
    </>,
    document.body
  );
}