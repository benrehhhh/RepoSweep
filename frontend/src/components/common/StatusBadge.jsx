import { classifyRepo } from '../../lib/classify.js';

export default function RepositoryStatusBadge({ repo }) {
  if (!repo) return null;
  const status = classifyRepo(repo);
  return (
    <span className={`repo-status ${status.tone}`}>
      <i className={`bi ${status.icon}`} aria-hidden="true" />
      <span>{status.label}</span>
    </span>
  );
}

export function ProtectedTag({ small = false }) {
  return (
    <span className="protected-tag" title="Protected from bulk destructive actions">
      <i className="bi bi-shield-lock-fill" aria-hidden="true" />
      <span>{small ? '' : 'Protected'}</span>
    </span>
  );
}