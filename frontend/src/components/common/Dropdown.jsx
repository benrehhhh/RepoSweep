import { useState } from 'react';
import useClickOutside from '../../hooks/useClickOutside.js';

export default function Dropdown({
  toggle,
  children,
  align = 'start',
  className = '',
  menuClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false), open);

  return (
    <div className={`rs-dropdown position-relative ${className}`} ref={ref}>
      <button
        type="button"
        className="btn btn-outline-secondary btn-ghost d-inline-flex align-items-center gap-1"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {toggle}
      </button>
      {open && (
        <div
          className={`dropdown-menu show dropdown-menu-${align} position-absolute ${menuClassName}`}
          style={{ top: 'calc(100% + 4px)', zIndex: 1030 }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownSection({ label, children }) {
  return (
    <div>
      <div className="px-2 pt-2 pb-1" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--rs-text-muted)' }}>
        {label}
      </div>
      {children}
    </div>
  );
}