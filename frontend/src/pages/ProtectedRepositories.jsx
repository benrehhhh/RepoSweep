import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { listProtected, addProtected, removeProtected } from '../services/protected.js';
import { formatDate } from '../lib/format.js';
import EmptyState from '../components/common/EmptyState.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import Modal from '../components/common/Modal.jsx';

export default function ProtectedRepositories() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['protected'],
    queryFn: listProtected,
  });

  const [showAdd, setShowAdd] = useState(false);
  const [owner, setOwner] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [notice, setNotice] = useState(null);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['protected'] });
    await queryClient.invalidateQueries({ queryKey: ['repositories'] });
  }

  async function handleAdd() {
    setSubmitting(true);
    setFormError(null);
    try {
      await addProtected(owner.trim(), name.trim());
      setName('');
      setOwner('');
      setShowAdd(false);
      await refresh();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(item) {
    setNotice(null);
    try {
      await removeProtected(item.id);
      await refresh();
    } catch (err) {
      setNotice(err.message);
      setTimeout(() => setNotice(null), 4000);
    }
  }

  if (isLoading) return <LoadingState label="Loading protected repositories…" rows={4} />;
  if (isError) return <ErrorState message={error?.message} onRetry={refetch} />;

  const items = data?.items || [];

  return (
    <>
      {notice && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3">
          <i className="bi bi-exclamation-circle" aria-hidden="true" />
          {notice}
        </div>
      )}

      <div className="page-head d-flex flex-wrap align-items-end justify-content-between gap-2">
        <div>
          <h1>Protected Repositories</h1>
          <p>
            Shielded from bulk deletion by default. Remove protection before destructive actions
            can touch them.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <i className="bi bi-shield-plus me-1" aria-hidden="true" />
          Protect Repository
        </button>
      </div>

      <div className="protection-note mb-4">
        <i className="bi bi-shield-lock-fill" aria-hidden="true" />
        <span>
          Protected repositories remain fully visible in your workspace, but are excluded from
          bulk deletion and bulk archiving until you remove their protection.
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="bi-shield-lock"
          title="Nothing protected yet"
          message="Add important repositories here so they’re never caught up in a bulk sweep."
          action={
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowAdd(true)}>
              <i className="bi bi-shield-plus me-1" aria-hidden="true" />
              Protect a repository
            </button>
          }
        />
      ) : (
        <div className="row g-3">
          {items.map((item) => (
            <div key={item.id} className="col-md-6 col-xl-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className="d-grid place-items-center rounded"
                      style={{
                        width: 38,
                        height: 38,
                        background: 'var(--rs-accent-muted)',
                        color: 'var(--rs-accent)',
                        border: '1px solid rgba(9,105,218,0.25)',
                        flex: '0 0 auto',
                      }}
                      aria-hidden="true"
                    >
                      <i className="bi bi-shield-lock-fill" />
                    </div>
                    <div className="minw-0 flex-grow-1">
                      <div className="fw-semibold text-truncate" style={{ fontSize: 15 }}>
                        {item.repository_name}
                      </div>
                      <div className="text-muted-rs small">{item.owner}</div>
                      <div className="text-muted-rs small mt-2">
                        Protected {item.created_at ? formatDate(item.created_at) : ''}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-transparent d-flex gap-2 py-2">
                  {item.in_repositories ? (
                    <span className="badge text-bg-success d-inline-flex align-items-center gap-1">
                      <i className="bi bi-check-circle" aria-hidden="true" />
                      In your repositories
                    </span>
                  ) : (
                    <span className="badge text-bg-warning d-inline-flex align-items-center gap-1">
                      <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                      Not found in your repositories
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm ms-auto text-muted-rs"
                    onClick={() => handleRemove(item)}
                  >
                    <i className="bi bi-shield-slash me-1" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showAdd}
        onClose={() => {
          setShowAdd(false);
          setFormError(null);
        }}
        title="Protect a repository"
        icon="bi-shield-plus"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)} disabled={submitting}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={submitting || !owner.trim() || !name.trim()}
            >
              {submitting && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />}
              <i className="bi bi-shield-lock me-1" aria-hidden="true" />
              Protect repository
            </button>
          </>
        }
      >
        <p className="text-muted-rs" style={{ fontSize: 13 }}>
          Protect any repository you own by entering its owner and name. It will be excluded from
          bulk destructive actions until protection is removed.
        </p>
        {formError && (
          <div className="alert alert-danger py-2 small d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-circle" aria-hidden="true" />
            {formError}
          </div>
        )}
        <div className="mb-3">
          <label className="form-label" htmlFor="protect-owner">Owner</label>
          <input
            id="protect-owner"
            type="text"
            className="form-control mono"
            placeholder="demo-user"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          />
        </div>
        <div className="mb-1">
          <label className="form-label" htmlFor="protect-name">Repository name</label>
          <input
            id="protect-name"
            type="text"
            className="form-control mono"
            placeholder="my-important-repo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
          />
        </div>
      </Modal>
    </>
  );
}