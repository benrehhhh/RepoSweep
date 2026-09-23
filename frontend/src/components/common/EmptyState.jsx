export default function EmptyState({
  icon = 'bi-inbox',
  title = 'Nothing here yet',
  message = '',
  action = null,
}) {
  return (
    <div className="text-center py-5" style={{ maxWidth: 420, margin: '0 auto' }}>
      <div
        className="mx-auto mb-3 d-grid place-items-center rounded-circle"
        style={{
          width: 56,
          height: 56,
          background: 'var(--rs-surface-alt)',
          border: '1px solid var(--rs-border-subtle)',
          color: 'var(--rs-text-muted)',
        }}
      >
        <i className={`bi ${icon}`} style={{ fontSize: 24 }} aria-hidden="true" />
      </div>
      <h6 className="fw-semibold mb-1">{title}</h6>
      {message && (
        <p className="text-muted-rs mb-3" style={{ fontSize: 13.5 }}>
          {message}
        </p>
      )}
      {action}
    </div>
  );
}