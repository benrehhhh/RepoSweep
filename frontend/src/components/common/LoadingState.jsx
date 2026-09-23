export default function LoadingState({ label = 'Loading…', rows = 5 }) {
  return (
    <div className="py-4">
      <div className="d-flex align-items-center gap-2 text-muted-rs mb-3">
        <span
          className="spinner-border spinner-border-sm"
          role="status"
          aria-hidden="true"
          style={{ width: 16, height: 16 }}
        />
        <span style={{ fontSize: 13.5 }}>{label}</span>
      </div>
      <div className="d-flex flex-column gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 44, borderRadius: 'var(--rs-radius)' }}
          />
        ))}
      </div>
    </div>
  );
}