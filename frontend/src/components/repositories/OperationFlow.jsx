import { useEffect, useMemo, useRef, useState } from 'react';

import Modal from '../common/Modal.jsx';

const ACTION_LABEL = {
  delete: { noun: 'deleted', verb: 'deleting', title: 'Sweep completed' },
  archive: { noun: 'archived', verb: 'archiving', title: 'Archive completed' },
};

function ItemStatus({ status }) {
  if (status === 'success') {
    return (
      <span className="op-status-icon ok" aria-label="Succeeded">
        <i className="bi bi-check-lg" aria-hidden="true" />
      </span>
    );
  }
  if (status === 'skipped') {
    return (
      <span className="op-status-icon skip" aria-label="Skipped">
        <i className="bi bi-shield-lock" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="op-status-icon bad" aria-label="Failed">
      <i className="bi bi-x-lg" aria-hidden="true" />
    </span>
  );
}

export default function OperationFlow({
  open,
  action,
  count = 0,
  manifest,
  error,
  onClose,
  onRetry,
  onViewActivity,
}) {
  const [revealed, setRevealed] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);
  const results = manifest?.results || [];

  useEffect(() => {
    if (!open) {
      setRevealed(0);
      setAnimating(false);
      return undefined;
    }
    if (manifest && results.length > 0) {
      setRevealed(0);
      setAnimating(true);
      let i = 0;
      timerRef.current = setInterval(() => {
        i += 1;
        if (i > results.length) {
          clearInterval(timerRef.current);
          setAnimating(false);
          setRevealed(results.length);
        } else {
          setRevealed(i);
        }
      }, 140);
      return () => clearInterval(timerRef.current);
    }
    return undefined;
  }, [open, manifest]); // eslint-disable-line react-hooks/exhaustive-deps

  const label = action ? ACTION_LABEL[action] : null;
  const shown = manifest ? results.slice(0, revealed) : [];
  const pending = manifest ? results.length - revealed : 0;
  const progress = manifest ? Math.round((revealed / results.length) * 100) : null;

  const summaries = useMemo(() => {
    if (!manifest) return { ok: 0, bad: 0, skip: 0, failedItems: [] };
    const ok = manifest.succeeded || 0;
    const bad = manifest.failed || 0;
    const skip = manifest.skipped || 0;
    const failedItems = (manifest.results || [])
      .filter((r) => r.status === 'failed')
      .map((r) => ({ owner: r.owner, name: r.repository_name }));
    return { ok, bad, skip, failedItems };
  }, [manifest]);

  const copy = {
    verb: action ? ACTION_LABEL[action].verb : 'processing',
    noun: action ? ACTION_LABEL[action].noun : 'processed',
  };

  const title =
    !manifest && !error
      ? `Sweeping repositories…`
      : error
        ? 'Operation failed'
        : label?.title || 'Operation completed';

  return (
    <Modal open={open} onClose={onClose} title={title} icon="bi-cone-striped" scrollable>
      {error ? (
        <div className="text-center py-3">
          <div className="op-status-icon bad mx-auto mb-2" style={{ width: 44, height: 44 }}>
            <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          </div>
          <p className="text-muted-rs mb-3">{error}</p>
          <p className="small text-muted-rs mb-0">
            No repositories were changed. Your other selected repositories were processed
            successfully where possible.
          </p>
        </div>
      ) : !manifest ? (
        <div className="text-center py-4">
          <div className="d-flex justify-content-center mb-3">
            <span
              className="spinner-border"
              role="status"
              aria-hidden="true"
              style={{ width: 28, height: 28 }}
            />
          </div>
          <p className="fw-semibold mb-1">
            {action === 'delete' ? 'Deleting' : 'Archiving'} {count} {count === 1 ? 'repository' : 'repositories'}…
          </p>
          <p className="text-muted-rs small mb-0">
            Hold tight — this can take a moment when GitHub is slow.
          </p>
          <div className="progress mt-4" role="progressbar" aria-label="Working">
            <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: '100%', background: 'var(--rs-accent)' }} />
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              className={`op-status-icon ${manifest.status === 'success' ? 'ok' : manifest.status === 'failed' ? 'bad' : 'skip'}`}
              style={{ width: 44, height: 44 }}
              aria-hidden="true"
            >
              <i
                className={`bi ${
                  manifest.status === 'success'
                    ? 'bi-check-lg'
                    : manifest.status === 'failed'
                      ? 'bi-x-lg'
                      : 'bi-exclamation-lg'
                }`}
              />
            </div>
            <div>
              <div className="fw-semibold">
                {manifest.total} {manifest.total === 1 ? 'repository' : 'repositories'} selected
              </div>
              <div className="text-muted-rs small">
                <span className="icon-success me-2">
                  {summaries.ok} {copy.noun} successfully
                </span>
                {summaries.bad > 0 && <span className="text-fire me-2">{summaries.bad} failed</span>}
                {summaries.skip > 0 && (
                  <span className="text-muted-rs">{summaries.skip} protected</span>
                )}
              </div>
            </div>
          </div>

          <div className="progress mb-3" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="progress-bar"
              style={{ width: `${progress}%`, background: manifest.status === 'failed' ? 'var(--rs-danger)' : 'var(--rs-accent)' }}
            />
          </div>
          <div className="text-muted-rs small mb-2">
            {revealed} of {results.length} processed
          </div>

          <div className="d-flex flex-column gap-1" aria-live="polite">
            {shown.map((item) => (
              <div className={`repo-line-item ${animating ? 'justify-content-between' : ''}`} key={`${item.owner}/${item.repository_name}`}>
                <div className="d-flex align-items-center gap-2 minw-0">
                  <span className="icon-wrap">
                    <i className={`bi ${item.status === 'success' ? 'bi-check-lg ok' : item.status === 'skipped' ? 'bi-shield-lock skip' : 'bi-x-lg bad'}`} aria-hidden="true" />
                  </span>
                  <span className="mono">{item.repository_name}</span>
                </div>
                {!animating && item.status === 'failed' && item.error_message && (
                  <span className="small text-muted-rs text-end ms-2" style={{ maxWidth: '55%' }}>
                    {item.error_message}
                  </span>
                )}
              </div>
            ))}
            {pending > 0 && (
              <div className="repo-line-item text-muted-rs" aria-hidden="true">
                <span className="icon-wrap">
                  <i className="bi bi-arrow-repeat" />
                </span>
                <span className="mono">{pending} more…</span>
              </div>
            )}
          </div>

          {!animating && manifest.status !== 'success' && summaries.bad > 0 && (
            <div className="alert alert-warning mt-3 mb-0 d-flex align-items-start gap-2">
              <i className="bi bi-info-circle-fill" aria-hidden="true" />
              <div>
                Some repositories couldn’t be {copy.noun}. The failed ones were left untouched on
                GitHub. You can retry them.
              </div>
            </div>
          )}
        </>
      )}

      {!(manifest || error) && (
        <div className="d-flex justify-content-end mt-3">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      )}
      {(manifest || error) && (
        <div className="d-flex flex-wrap gap-2 justify-content-end mt-3">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Back to Repositories
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={onViewActivity}>
            <i className="bi bi-clock-history me-1" aria-hidden="true" />
            View Activity
          </button>
          {!error && summaries.bad > 0 && (
            <button type="button" className="btn btn-outline-danger" onClick={() => onRetry(summaries.failedItems)}>
              <i className="bi bi-arrow-repeat me-1" aria-hidden="true" />
              Retry failed
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}