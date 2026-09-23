import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { listActivity } from '../services/protected.js';
import { dayGroupLabel, formatDateTime } from '../lib/format.js';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';

const ACTION_META = {
  delete: { icon: 'bi-trash', label: 'Bulk deleted', textClass: 'text-fire' },
  archive: { icon: 'bi-archive', label: 'Bulk archived', textClass: 'text-muted-rs' },
  protect: { icon: 'bi-shield-lock', label: 'Protected', textClass: 'text-muted-rs' },
  unprotect: { icon: 'bi-shield-slash', label: 'Unprotected', textClass: 'text-muted-rs' },
};

function StatusBadge({ status }) {
  if (status === 'success') return <span className="badge text-bg-success">Success</span>;
  if (status === 'partial') return <span className="badge text-bg-warning">Partial</span>;
  return <span className="badge text-bg-danger">Failed</span>;
}

function ActivityItem({ log }) {
  const meta = ACTION_META[log.action] || ACTION_META.archive;
  const okCount = (log.items || []).filter((i) => i.status === 'success').length;
  const failedCount = (log.items || []).filter((i) => i.status === 'failed').length;

  return (
    <div className={`timeline-item ${log.status === 'success' ? 'ok' : log.status === 'failed' ? 'bad' : 'warn'}`}>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
        <i className={`bi ${meta.icon}`} aria-hidden="true" />
        <span className="fw-semibold" style={{ fontSize: 14 }}>
          {meta.label.toLowerCase()} {log.repository_count}{' '}
          {log.repository_count === 1 ? 'repository' : 'repositories'}
        </span>
        <StatusBadge status={log.status} />
        <span className="text-muted-rs small ms-auto">{formatDateTime(log.created_at)}</span>
      </div>
      {log.items && log.items.length > 0 && (
        <div className="d-flex flex-wrap gap-1 mt-1">
          {(log.items || []).slice(0, 6).map((item) => (
            <span key={item.id} className={`code-chip ${item.status === 'failed' ? 'text-fire' : item.status === 'skipped' ? '' : ''}`}>
              {item.status === 'success' && <i className="bi bi-check-lg text-muted-rs me-1" aria-hidden="true" />}
              {item.status === 'failed' && '✗ '}
              {item.status === 'skipped' && (
                <i className="bi bi-shield-lock me-1" aria-hidden="true" />
              )}
              {item.repository_name}
            </span>
          ))}
          {log.items.length > 6 && (
            <span className="code-chip text-muted-rs">+{log.items.length - 6} more</span>
          )}
        </div>
      )}
      {(failedCount > 0 || (log.status === 'partial' && okCount > 0)) && (
        <p className="small text-muted-rs mb-0 mt-1">
          {failedCount > 0
            ? `${failedCount} failed ${failedCount === 1 ? 'item' : 'items'} were left untouched on GitHub.`
            : 'Some items were skipped.'}
        </p>
      )}
    </div>
  );
}

export default function Activity() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['activity'],
    queryFn: listActivity,
  });

  const grouped = useMemo(() => {
    const items = data?.items || [];
    const map = new Map();
    for (const log of items) {
      const label = dayGroupLabel(log.created_at);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(log);
    }
    return [...map.entries()];
  }, [data]);

  if (isLoading) return <LoadingState label="Loading activity…" rows={5} />;
  if (isError) return <ErrorState message={error?.message} onRetry={refetch} />;

  return (
    <>
      <div className="page-head">
        <h1>Activity</h1>
        <p>A history of every sweep, archive, and protection change you've made.</p>
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          icon="bi-clock-history"
          title="No activity yet"
          message="Bulk sweeps and protection changes will show up here."
          action={
            <Link to="/app/repositories" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-collection me-1" aria-hidden="true" />
              Open Repositories
            </Link>
          }
        />
      ) : (
        <div className="card p-4">
          <div className="timeline">
            {grouped.map(([day, logs]) => (
              <div key={day}>
                <div className="timeline-day">{day}</div>
                {logs.map((log) => (
                  <ActivityItem key={log.id} log={log} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}