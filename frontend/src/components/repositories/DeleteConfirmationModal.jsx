import { useEffect, useState } from 'react';

import Modal from '../common/Modal.jsx';

export default function DeleteConfirmationModal({ open, onClose, repos, onConfirm, submitting }) {
  const [phrase, setPhrase] = useState('');
  const canConfirm = phrase === 'DELETE' && !submitting && repos.length > 0;

  useEffect(() => {
    if (open) setPhrase('');
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Delete ${repos.length} ${repos.length === 1 ? 'repository' : 'repositories'}?`}
      icon="bi-trash3-fill text-fire"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={!canConfirm}
            onClick={() => onConfirm()}
          >
            {submitting && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />}
            <i className="bi bi-trash me-1" aria-hidden="true" />
            Delete {repos.length > 0 ? repos.length : ''} {repos.length === 1 ? 'repository' : 'repositories'}
          </button>
        </>
      }
    >
      <div className="alert alert-danger d-flex align-items-start gap-2 mb-3">
        <i className="bi bi-exclamation-triangle-fill mt-0" aria-hidden="true" />
        <div>
          <strong>This action permanently deletes these repositories from GitHub.</strong>{' '}
          Deletion cannot be undone through RepoSweep. Protected repositories are excluded from
          bulk deletion.
        </div>
      </div>

      <label className="form-label">Repositories to delete</label>
      <div className="d-flex flex-column gap-1" style={{ maxHeight: 260, overflowY: 'auto' }}>
        {repos.map((repo) => (
          <div className="repo-line-item" key={repo.full_name}>
            <span className="icon-wrap bad" aria-hidden="true">
              <i className="bi bi-trash" />
            </span>
            <span className="mono">{repo.full_name}</span>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <label className="form-label" htmlFor="delete-confirm-input">
          Type <span className="code-chip">DELETE</span> to confirm
        </label>
        <input
          id="delete-confirm-input"
          type="text"
          className={`form-control mono ${phrase && phrase !== 'DELETE' ? 'is-invalid' : ''}`}
          placeholder="DELETE"
          value={phrase}
          autoComplete="off"
          spellCheck="false"
          onChange={(e) => setPhrase(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canConfirm) onConfirm();
          }}
        />
        {phrase && phrase !== 'DELETE' && (
          <div className="invalid-feedback">Type exactly DELETE (all caps) to enable deletion.</div>
        )}
        {canConfirm && (
          <div className="form-text" style={{ color: 'var(--rs-danger)' }}>
            <i className="bi bi-shield-exclamation me-1" aria-hidden="true" />
            You're about to permanently delete {repos.length} {repos.length === 1 ? 'repository' : 'repositories'}.
          </div>
        )}
      </div>
    </Modal>
  );
}