export default function ErrorState({ message, onRetry = null }) {
  return (
    <div className="text-center py-5" style={{ maxWidth: 460, margin: '0 auto' }}>
      <div
        className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
        style={{
          width: 56,
          height: 56,
          background: 'var(--rs-danger-muted)',
          border: '1px solid rgba(207,34,46,0.25)',
          color: 'var(--rs-danger)',
        }}
      >
        <i className="bi bi-exclamation-triangle" style={{ fontSize: 24 }} aria-hidden="true" />
      </div>
      <h6 className="fw-semibold mb-1">Something went wrong</h6>
      <p className="text-muted-rs mb-3" style={{ fontSize: 13.5 }}>
        {message}
      </p>
      {onRetry && (
        <button type="button" className="btn btn-outline-secondary" onClick={onRetry}>
          <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}