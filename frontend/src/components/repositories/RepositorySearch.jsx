import { useRef } from 'react';

export default function RepositorySearch({ value, onChange, total }) {
  const inputRef = useRef(null);

  return (
    <div className="position-relative">
      <i
        className="bi bi-search position-absolute"
        aria-hidden="true"
        style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--rs-text-muted)' }}
      />
      <input
        ref={inputRef}
        type="search"
        className="form-control"
        style={{ paddingLeft: 34, paddingRight: 34 }}
        placeholder="Search repositories by name, description, or language…"
        aria-label="Search repositories"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="btn btn-ghost position-absolute d-grid"
          style={{ right: 4, top: '50%', transform: 'translateY(-50%)', width: 26, height: 26, padding: 0 }}
          aria-label="Clear search"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      )}
      {total !== undefined && (
        <span className="position-absolute d-none d-md-block text-muted-rs mono"
          style={{ right: value ? 38 : 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12 }}>
          {total} repos
        </span>
      )}
    </div>
  );
}