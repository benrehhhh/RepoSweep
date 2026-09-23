import RepositoryStatusBadge, { ProtectedTag } from '../common/StatusBadge.jsx';
import { formatNumber, timeAgo } from '../../lib/format.js';

function LanguageDot({ language }) {
  if (!language) return null;
  return (
    <span className="d-inline-flex align-items-center gap-1 small text-muted-rs" style={{ whiteSpace: 'nowrap' }}>
      <span className="lang-dot" aria-hidden="true" />
      {language}
    </span>
  );
}

export default function RepositoryRow({ repo, selected, onToggle, onOpen }) {
  const isProtected = Boolean(repo.protected);
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;

  return (
    <tr
      className={selected ? 'table-row-selected' : ''}
      style={selected ? { background: 'var(--rs-accent-muted)' } : undefined}
      onClick={(e) => {
        if (e.target.closest('a, input, button')) return;
        onOpen(repo);
      }}
    >
      <td className="text-center" style={{ width: 40 }}>
        <input
          type="checkbox"
          className="form-check-input mt-0"
          checked={selected}
          disabled={isProtected}
          aria-label={isProtected ? `${repo.name} is protected from bulk actions` : `Select ${repo.name}`}
          title={isProtected ? 'Protected — remove protection to include in bulk actions' : `Select ${repo.name}`}
          onChange={onToggle}
        />
      </td>
      <td>
        <div className="repo-name-wrap">
          <div className="d-flex align-items-center gap-2">
            <a
              className="repo-name-link"
              onClick={(e) => {
                e.preventDefault();
                onOpen(repo);
              }}
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
            >
              {repo.name}
            </a>
            {repo.fork && <i className="bi bi-diagram-3 text-muted-rs" title="Fork" aria-label="Fork" />}
            {isProtected && <ProtectedTag small />}
          </div>
          {repo.description && <div className="repo-description">{repo.description}</div>}
          <div className="repo-meta-line">
            <span className="d-inline-flex align-items-center gap-1 small text-muted-rs">
              <i className="bi bi-star" aria-hidden="true" />
              {formatNumber(stars)}
            </span>
            {forks > 0 && (
              <span className="d-inline-flex align-items-center gap-1 small text-muted-rs">
                <i className="bi bi-diagram-3" aria-hidden="true" />
                {formatNumber(forks)}
              </span>
            )}
            {repo.language && <LanguageDot language={repo.language} />}
          </div>
        </div>
      </td>
      <td>
        <span className="vis-chip">
          <i className={`bi ${repo.private !== false ? 'bi-lock' : 'bi-globe2'}`} aria-hidden="true" />
          {repo.private !== false ? 'Private' : 'Public'}
        </span>
      </td>
      <td className="text-muted-rs" style={{ whiteSpace: 'nowrap' }}>
        {repo.language || <span className="text-muted-rs">—</span>}
      </td>
      <td className="text-muted-rs" style={{ whiteSpace: 'nowrap' }} title={repo.pushed_at || repo.updated_at}>
        {timeAgo(repo.pushed_at || repo.updated_at)}
      </td>
      <td>
        <RepositoryStatusBadge repo={repo} />
      </td>
    </tr>
  );
}