import Offcanvas from '../common/Offcanvas.jsx';
import RepositoryStatusBadge, { ProtectedTag } from '../common/StatusBadge.jsx';
import { formatDate, formatNumber, formatSize, timeAgo } from '../../lib/format.js';

function Row({ label, value }) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  );
}

export default function RepositoryDetailsPanel({ repo, open, onClose, onToggleProtect, protecting }) {
  if (!repo) return null;
  const isProtected = Boolean(repo.protected);

  return (
    <Offcanvas open={open} onClose={onClose} title="Repository details" side="end">
      <div className="details-hero">
        <img
          className="avatar"
          src={repo.owner?.avatar_url}
          alt=""
          aria-hidden="true"
        />
        <div className="minw-0">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold" style={{ fontSize: 15 }}>
              {repo.name}
            </span>
            {isProtected && <ProtectedTag />}
          </div>
          <div className="text-muted-rs small">
            {repo.owner?.login}/{repo.name}
          </div>
        </div>
      </div>

      <div className="p-3 border-bottom">
        <RepositoryStatusBadge repo={repo} />
        {repo.archived && (
          <span className="small text-muted-rs d-block mt-1">
            Flagged as archived
          </span>
        )}
      </div>

      {repo.description && (
        <p className="px-3 pt-3 mb-0" style={{ color: 'var(--rs-text-secondary)', fontSize: 13.5 }}>
          {repo.description}
        </p>
      )}

      <dl className="detail-grid">
        <Row label="Owner" value={repo.owner?.login} />
        <Row label="Visibility" value={repo.private !== false ? 'Private' : 'Public'} />
        <Row label="Default branch" value={<span className="mono">{repo.default_branch}</span>} />
        <Row label="Language" value={repo.language} />
        <Row label="Created" value={formatDate(repo.created_at)} />
        <Row label="Last push" value={repo.pushed_at ? `${timeAgo(repo.pushed_at)} (${formatDate(repo.pushed_at)})` : null} />
        <Row label="Stars" value={repo.stargazers_count != null ? formatNumber(repo.stargazers_count) : null} />
        <Row label="Forks" value={repo.forks_count != null ? formatNumber(repo.forks_count) : null} />
        <Row label="Open issues" value={repo.open_issues_count != null ? repo.open_issues_count : null} />
        <Row label="Size" value={repo.size != null ? formatSize(repo.size) : null} />
        <Row label="Fork" value={repo.fork ? 'Yes' : 'No'} />
        <Row label="Archived" value={repo.archived ? 'Yes' : 'No'} />
      </dl>

      <div className="d-flex flex-column gap-2 p-3 border-top">
        <a className="btn btn-primary w-100" href={repo.html_url} target="_blank" rel="noreferrer">
          <i className="bi bi-box-arrow-up-right me-1" aria-hidden="true" />
          Open on GitHub
        </a>
        <button
          type="button"
          className={`btn w-100 ${isProtected ? 'btn-outline-secondary' : 'btn-outline-secondary'}`}
          disabled={protecting}
          onClick={() => onToggleProtect(repo)}
        >
          {protecting ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />
              Updating…
            </>
          ) : isProtected ? (
            <>
              <i className="bi bi-shield-slash me-1" aria-hidden="true" />
              Remove protection
            </>
          ) : (
            <>
              <i className="bi bi-shield-plus me-1" aria-hidden="true" />
              Protect repository
            </>
          )}
        </button>
        <button type="button" className="btn btn-ghost w-100" onClick={onClose}>
          Close
        </button>
      </div>

      {isProtected && (
        <div className="px-3 pb-3">
          <div className="protection-note" role="note">
            <i className="bi bi-shield-lock-fill" aria-hidden="true" />
            <span>
              Protected. This repository is excluded from bulk destructive actions. Remove
              protection before deleting it.
            </span>
          </div>
        </div>
      )}
    </Offcanvas>
  );
}