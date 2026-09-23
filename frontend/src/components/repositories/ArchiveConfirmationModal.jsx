import Modal from '../common/Modal.jsx';

export default function ArchiveConfirmationModal({ open, onClose, repos, onConfirm, submitting }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Archive ${repos.length} ${repos.length === 1 ? 'repository' : 'repositories'}?`}
      icon="bi-archive"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onConfirm()}
            disabled={submitting || repos.length === 0}
          >
            {submitting && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />}
            <i className="bi bi-archive me-1" aria-hidden="true" />
            Archive {repos.length > 0 ? repos.length : ''} {repos.length === 1 ? 'repository' : 'repositories'}
          </button>
        </>
      }
    >
      <div className="d-flex align-items-start gap-2 mb-3" style={{ color: 'var(--rs-accent)', background: 'var(--rs-accent-muted)', border: '1px solid rgba(9,105,218,0.25)', borderRadius: 'var(--rs-radius)', padding: '12px 14px', fontSize: 13.5 }}>
        <i className="bi bi-info-circle-fill" aria-hidden="true" />
        <div>
          Archiving makes repositories read-only on GitHub but <strong>keeps them intact</strong>.
          This is a safer first step than deletion, and you can unarchive them later.
        </div>
      </div>

      <label className="form-label">Repositories to archive</label>
      <div className="d-flex flex-column gap-1" style={{ maxHeight: 260, overflowY: 'auto' }}>
        {repos.map((repo) => (
          <div className="repo-line-item" key={repo.full_name}>
            <span className="icon-wrap" aria-hidden="true">
              <i className="bi bi-archive" />
            </span>
            <span className="mono">{repo.full_name}</span>
            {repo.archived && (
              <span className="badge text-bg-secondary ms-auto">Already archived</span>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}