import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

function focusableSelector() {
  return [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer = null,
  size = 'md',
  icon = null,
  scrollable = false,
}) {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      dialogRef.current?.focus();
    }, 30);

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusables = dialog.querySelectorAll(focusableSelector());
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused.current && typeof previouslyFocused.current.focus === 'function') {
        previouslyFocused.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="modal-backdrop fade show" aria-hidden="true" />
      <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true"
        aria-label={title}>
        <div
          className={`modal-dialog ${scrollable ? 'modal-dialog-scrollable' : 'modal-dialog-centered'} modal-${size}`}
          ref={dialogRef}
          tabIndex={-1}
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center gap-2">
                {icon && <i className={`bi ${icon} text-muted-rs`} aria-hidden="true" />}
                {title}
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close dialog"
                onClick={onClose}
              />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}