import { Link } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.jsx';
import { useRepositories } from '../hooks/useRepositories.js';
import { classifyRepo, STATUS } from '../lib/classify.js';
import { greeting, timeAgo } from '../lib/format.js';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';

function StatCard({ icon, label, value, note, tone = '' }) {
  return (
    <div className={`stat-card h-100 ${tone}`}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">
          <i className={`bi ${icon}`} aria-hidden="true" />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user, demoMode } = useAuth();
  const { data, isLoading, isError, error, refetch } = useRepositories();

  if (isLoading) {
    return <LoadingState label="Loading your repositories…" rows={5} />;
  }

  if (isError) {
    return <ErrorState message={error?.message} onRetry={refetch} />;
  }

  const repos = data?.repositories || [];
  const first = repos[0];

  let active = 0;
  let inactive = 0;
  let stale = 0;
  let archivedCount = 0;
  let recently = 0;
  const needsReview = [];

  for (const repo of repos) {
    const s = classifyRepo(repo);
    if (s.key === STATUS.ACTIVE) active += 1;
    if (s.key === STATUS.INACTIVE) inactive += 1;
    if (s.key === STATUS.STALE) stale += 1;
    if (s.key === STATUS.ARCHIVED) archivedCount += 1;

    const days = repo.pushed_at || repo.updated_at;
    if (days && (s.key === STATUS.ACTIVE)) recently += 1;

    if ((s.key === STATUS.INACTIVE || s.key === STATUS.STALE) && !repo.archived) {
      needsReview.push({ repo, status: s });
    }
  }

  const name = user?.display_name || user?.username || 'there';

  return (
    <>
      <div className="page-head d-flex flex-wrap align-items-end justify-content-between gap-2">
        <div>
          <h1>
            {greeting()}, {name}.
          </h1>
          <p>
            {data.total} repositories in your account. <strong>Inactivity is only an indicator</strong> — you decide what happens next.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/app/repositories" className="btn btn-primary">
            <i className="bi bi-collection me-1" aria-hidden="true" />
            Open Repositories
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard icon="bi-collection" label="Total" value={data.total} tone="stat-info" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard icon="bi-lightning-charge-fill" label="Active" value={active} note="updated ≤ 90 days" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard icon="bi-exclamation-triangle-fill" label="Potentially inactive" value={inactive} note="90–365 days" tone="stat-warn" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard icon="bi-moon-stars-fill" label="No recent activity" value={stale} note="more than 1 year" tone="stat-danger" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard icon="bi-archive" label="Archived" value={archivedCount} note="read-only on GitHub" />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard icon="bi-arrow-repeat" label="Recently updated" value={recently} note="in the last 90 days" />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-7">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between bg-transparent py-3">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-clock-history text-muted-rs" aria-hidden="true" />
                <h6 className="mb-0 fw-semibold">Potentially inactive — review before deciding</h6>
              </div>
              {needsReview.length > 0 && (
                <span className="badge text-bg-warning">{needsReview.length}</span>
              )}
            </div>
            <div className="card-body p-0">
              {needsReview.length === 0 ? (
                <p className="text-muted-rs small p-3 mb-0">
                  Nothing stands out. Every repository has seen activity within the last year or is archived.
                </p>
              ) : (
                <ul className="list-group list-group-flush">
                  {needsReview.slice(0, 6).map(({ repo, status }) => (
                    <li key={repo.id} className="list-group-item d-flex align-items-center justify-content-between gap-3">
                      <Link
                        to="/app/repositories"
                        className="text-decoration-none fw-semibold text-truncate"
                        style={{ color: 'var(--rs-text)' }}
                      >
                        <i className={`bi ${status.icon} me-2`} style={{ color: status.key === STATUS.STALE ? 'var(--rs-warning)' : 'var(--rs-warning)' }} aria-hidden="true" />
                        {repo.name}
                      </Link>
                      <span className="text-muted-rs small text-nowrap">
                        {timeAgo(repo.pushed_at || repo.updated_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card-footer bg-transparent py-2 border-top">
              <Link to="/app/repositories?status=potentially-inactive" className="small text-decoration-none">
                <i className="bi bi-arrow-right me-1" aria-hidden="true" />
                View all potentially inactive
              </Link>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card">
            <div className="card-header bg-transparent py-3">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-terminal text-muted-rs" aria-hidden="true" />
                <h6 className="mb-0 fw-semibold">Quick actions</h6>
              </div>
            </div>
            <div className="card-body py-3">
              <div className="d-flex flex-column gap-2">
                <Link to="/app/repositories" className="btn btn-outline-secondary d-flex justify-content-between align-items-center">
                  <span>
                    <i className="bi bi-collection me-2" aria-hidden="true" />
                    Review & sweep repositories
                  </span>
                  <i className="bi bi-chevron-right" aria-hidden="true" />
                </Link>
                <Link to="/app/protected" className="btn btn-outline-secondary d-flex justify-content-between align-items-center">
                  <span>
                    <i className="bi bi-shield-lock me-2" aria-hidden="true" />
                    Manage protected repositories
                  </span>
                  <i className="bi bi-chevron-right" aria-hidden="true" />
                </Link>
                <Link to="/app/activity" className="btn btn-outline-secondary d-flex justify-content-between align-items-center">
                  <span>
                    <i className="bi bi-clock-history me-2" aria-hidden="true" />
                    View activity history
                  </span>
                  <i className="bi bi-chevron-right" aria-hidden="true" />
                </Link>
              </div>

              {first && (
                <div className="mt-4" style={{ borderTop: '1px solid var(--rs-border-subtle)', paddingTop: 14 }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-info-circle text-muted-rs" aria-hidden="true" />
                    <span className="text-muted-rs small">Why flags aren’t deletions</span>
                  </div>
                  <p className="text-muted-rs small mb-0">
                    A repository that hasn’t been updated in a year might still be exactly where you
                    want it. RepoSweep only ever <em>labels</em> inactivity — deleting always
                    requires you to select, review, and confirm.
                  </p>
                  {demoMode && (
                    <p className="small mb-0 mt-2" style={{ color: 'var(--rs-warning)' }}>
                      <i className="bi bi-flask me-1" aria-hidden="true" />
                      You’re viewing sample repositories in demo mode.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}