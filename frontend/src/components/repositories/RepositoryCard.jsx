import RepositoryStatusBadge, { ProtectedTag } from '../common/StatusBadge.jsx';
import { timeAgo } from '../../lib/format.js';

export default function RepositoryCard({ repo, selected, onToggle, onOpen }) {
  const isProtected = Boolean(repo.protected);

  return (
    <div className={`repo-card ${selected ? 'selected' : ''}`}>
      <div className="card-row">
        <input
          type="checkbox"
          className="form-check-input mt-1 flex-shrink-0"
          checked={selected}
          disabled={isProtected}
          aria-label={isProtected ? `${repo.name} is protected from bulk actions` : `Select ${repo.name}`}
          title={isProtected ? 'Protected — remove protection to include in bulk actions' : 'Select'}
          onChange={onToggle}
        />
        <div className="flex-grow-1 minw-0">
          <div className="d-flex align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2 text-truncate">
              <a
                className="repo-name-link text-truncate"
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  onOpen(repo);
                }}
              >
                {repo.name}
              </a>
              {repo.fork && <i className="bi bi-diagram-3 text-muted-rs" aria-label="Fork" />}
            </div>
            {isProtected && <ProtectedTag small />}
          </div>
          {repo.description && (
            <div className="repo-description" style={{ whiteSpace: 'normal' }}>
              {repo.description}
            </div>
          )}
          <div className="repo-meta-line flex-wrap mt-1">
            <span className="vis-chip">
              <i className={`bi ${repo.private !== false ? 'bi-lock' : 'bi-globe2'}`} aria-hidden="true" />
              {repo.private !== false ? 'Private' : 'Public'}
            </span>
            {repo.language && <span className="code-chip">{repo.language}</span>}
            <span className="text-muted-rs small">{timeAgo(repo.pushed_at || repo.updated_at)}</span>
            <RepositoryStatusBadge repo={repo} />
          </div>
        </div>
      </div>
    </div>
  );
}