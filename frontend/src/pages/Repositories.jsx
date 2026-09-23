import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useRepositories } from '../hooks/useRepositories.js';
import useDebounce from '../hooks/useDebounce.js';
import { classifyRepo } from '../lib/classify.js';
import { daysBetween } from '../lib/format.js';
import { bulkArchive, bulkDelete } from '../services/repositories.js';
import { listProtected, addProtected, removeProtected } from '../services/protected.js';

import RepositorySearch from '../components/repositories/RepositorySearch.jsx';
import RepositoryFilters, { STATUS_OPTIONS } from '../components/repositories/RepositoryFilters.jsx';
import SortMenu from '../components/repositories/SortMenu.jsx';
import RepositoryTable from '../components/repositories/RepositoryTable.jsx';
import RepositoryCard from '../components/repositories/RepositoryCard.jsx';
import SelectionToolbar from '../components/repositories/SelectionToolbar.jsx';
import RepositoryDetailsPanel from '../components/repositories/RepositoryDetailsPanel.jsx';
import DeleteConfirmationModal from '../components/repositories/DeleteConfirmationModal.jsx';
import ArchiveConfirmationModal from '../components/repositories/ArchiveConfirmationModal.jsx';
import OperationFlow from '../components/repositories/OperationFlow.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';

const PAGE_SIZE = 20;

function pageNumbers(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

function matchesUpdated(repo, range) {
  const days = daysBetween(repo.pushed_at || repo.updated_at);
  if (days === null) return false;
  switch (range) {
    case '7d':
      return days <= 7;
    case '30d':
      return days <= 30;
    case '3-6m':
      return days > 90 && days <= 180;
    case '6-12m':
      return days > 180 && days <= 365;
    case '1y+':
      return days > 365;
    default:
      return true;
  }
}

export default function Repositories() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const { data, isLoading, isError, error, refetch } = useRepositories();
  const protectedQuery = useQuery({
    queryKey: ['protected'],
    queryFn: listProtected,
    enabled: true,
  });

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [filters, setFilters] = useState(() => ({
    status: STATUS_OPTIONS.some((o) => o.value === searchParams.get('status'))
      ? searchParams.get('status')
      : 'all',
    visibility: 'all',
    language: 'all',
    updated: 'all',
    fork: 'all',
  }));
  const [sort, setSort] = useState({ key: 'updated', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState(() => new Set());
  const [details, setDetails] = useState(null);
  const [modal, setModal] = useState(null);
  const [op, setOp] = useState({ active: false, action: 'delete', count: 0, manifest: null, error: null });
  const [notice, setNotice] = useState(null);
  const [protecting, setProtecting] = useState(false);

  const repos = data?.repositories || [];

  const repoMap = useMemo(() => {
    const m = new Map();
    for (const repo of repos) {
      const fullName = repo.full_name || `${repo.owner?.login}/${repo.name}`;
      m.set(fullName, { ...repo, full_name: fullName });
    }
    return m;
  }, [repos]);

  const languages = useMemo(() => {
    const set = new Set();
    for (const repo of repos) if (repo.language) set.add(repo.language);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [repos]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return repos.filter((repo) => {
      if (filters.status !== 'all' && classifyRepo(repo).key !== filters.status) return false;
      if (filters.visibility === 'public' && repo.private !== false) return false;
      if (filters.visibility === 'private' && repo.private !== true) return false;
      if (filters.language !== 'all' && (repo.language || 'unknown') !== filters.language) return false;
      if (filters.updated !== 'all' && !matchesUpdated(repo, filters.updated)) return false;
      if (filters.fork === 'original' && repo.fork) return false;
      if (filters.fork === 'fork' && !repo.fork) return false;
      if (term) {
        const hay = `${repo.name} ${repo.description || ''} ${repo.language || ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [repos, filters, debouncedSearch]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const direction = sort.dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let av;
      let bv;
      switch (sort.key) {
        case 'name':
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
          break;
        case 'stars':
          av = a.stargazers_count || 0;
          bv = b.stargazers_count || 0;
          break;
        case 'size':
          av = a.size || 0;
          bv = b.size || 0;
          break;
        case 'created':
          av = daysBetween(a.created_at) ?? Infinity;
          bv = daysBetween(b.created_at) ?? Infinity;
          break;
        case 'updated':
        default:
          av = daysBetween(a.pushed_at || a.updated_at) ?? Infinity;
          bv = daysBetween(b.pushed_at || b.updated_at) ?? Infinity;
          break;
      }
      if (av < bv) return -1 * direction;
      if (av > bv) return 1 * direction;
      return 0;
    });
    return list;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selectedRepos = useMemo(
    () => [...selection].map((name) => repoMap.get(name)).filter(Boolean),
    [selection, repoMap]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  function toggleSelection(fullName) {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(fullName)) next.delete(fullName);
      else next.add(fullName);
      return next;
    });
  }

  function togglePage() {
    const selectable = pageItems.filter((r) => !r.protected);
    const allSelected = selectable.length > 0 && selectable.every((r) => selection.has(r.full_name));
    setSelection((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        selectable.forEach((r) => next.delete(r.full_name));
      } else {
        selectable.forEach((r) => next.add(r.full_name));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelection(new Set());
  }

  function openDetails(repo) {
    setDetails(repo);
  }

  async function runOperation(action) {
    const targets = selectedRepos;
    if (targets.length === 0) return;
    setModal(null);
    setOp({ active: true, action, count: targets.length, manifest: null, error: null });

    try {
      let manifest;
      if (action === 'delete') {
        manifest = await bulkDelete(
          targets.map((r) => ({ owner: r.owner?.login || 'demo-user', name: r.name })),
          'DELETE'
        );
      } else {
        manifest = await bulkArchive(
          targets.map((r) => ({ owner: r.owner?.login || 'demo-user', name: r.name }))
        );
      }
      setOp({ active: false, action, count: targets.length, manifest, error: null });
      if (action === 'delete') clearSelection();
      await queryClient.invalidateQueries({ queryKey: ['repositories'] });
    } catch (err) {
      setOp({ active: false, action, count: targets.length, manifest: null, error: err.message });
    }
  }

  function retryFailed(failedItems) {
    const targets = failedItems
      .map((i) => repoMap.get(`${i.owner}/${i.name}`))
      .filter(Boolean);
    if (targets.length === 0) {
      setOp({ active: false, action: 'delete', count: 0, manifest: null, error: null });
      return;
    }
    setOp({ active: false, action: op.action || 'delete', count: 0, manifest: null, error: null });
    setSelection(new Set(targets.map((r) => r.full_name)));
    setModal(op.action || 'delete');
  }

  function finishOp() {
    setOp({ active: false, action: 'delete', count: 0, manifest: null, error: null });
    queryClient.invalidateQueries({ queryKey: ['repositories'] });
    queryClient.invalidateQueries({ queryKey: ['protected'] });
  }

  async function handleToggleProtect(repo) {
    const fullName = repo.full_name || `${repo.owner?.login}/${repo.name}`;
    setProtecting(true);
    setNotice(null);
    try {
      if (repo.protected) {
        const rows = protectedQuery.data?.items || [];
        const row = rows.find((r) => r.full_name.toLowerCase() === fullName.toLowerCase());
        if (row) await removeProtected(row.id);
        setNotice(`${repo.name} is no longer protected.`);
      } else {
        await addProtected(repo.owner?.login || 'demo-user', repo.name);
        setNotice(`${repo.name} is now protected from bulk destructive actions.`);
      }
      setDetails((prev) => (prev ? { ...prev, protected: !prev.protected } : prev));
      await queryClient.invalidateQueries({ queryKey: ['repositories'] });
      await queryClient.invalidateQueries({ queryKey: ['protected'] });
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setProtecting(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading your repositories…" rows={8} />;
  if (isError) return <ErrorState message={error?.message} onRetry={refetch} />;

  const filterActive =
    filters.status !== 'all' ||
    filters.visibility !== 'all' ||
    filters.language !== 'all' ||
    filters.updated !== 'all' ||
    filters.fork !== 'all';

  return (
    <>
      {notice && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3">
          <i className="bi bi-check-circle" aria-hidden="true" />
          {notice}
        </div>
      )}

      <div className="repo-toolbar-card mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-lg-6">
            <RepositorySearch value={search} onChange={setSearch} />
          </div>
          <div className="col-12 col-lg-6 d-flex flex-wrap align-items-center justify-content-end gap-2">
            <SortMenu sort={sort} onChange={setSort} />
            <div className="repo-count-line mono text-muted-rs">
              {sorted.length === data.total
                ? `${data.total} repositories`
                : `${sorted.length} of ${data.total} match`}
            </div>
          </div>
          <div className="col-12">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-top pt-3" style={{ borderColor: 'var(--rs-border-subtle) !important' }}>
              <RepositoryFilters
                filters={filters}
                onChange={(f) => {
                  setFilters(f);
                }}
                languages={languages}
                activeCount={filterActive ? Object.values({ ...filters }).filter((v) => v !== 'all').length : 0}
              />
              {selectedRepos.length > 0 && (
                <button type="button" className="btn btn-ghost btn-sm text-muted-rs" onClick={clearSelection}>
                  <i className="bi bi-x-circle me-1" aria-hidden="true" />
                  Clear {selectedRepos.length} selected
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={filterActive || debouncedSearch ? 'bi-funnel' : 'bi-collection'}
          title={filterActive || debouncedSearch ? 'No repositories match these filters' : 'No repositories yet'}
          message={
            filterActive || debouncedSearch
              ? 'Try widening your search or clearing some filters.'
              : 'Repositories you can access will appear here.'
          }
          action={
            (filterActive || debouncedSearch) && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setSearch('');
                  setFilters({ status: 'all', visibility: 'all', language: 'all', updated: 'all', fork: 'all' });
                }}
              >
                <i className="bi bi-x-circle me-1" aria-hidden="true" />
                Clear search & filters
              </button>
            )
          }
        />
      ) : (
        <div className="d-none d-lg-block">
          <RepositoryTable
            repos={pageItems}
            selected={selection}
            onToggle={toggleSelection}
            onTogglePage={togglePage}
            onOpen={openDetails}
          />
        </div>
      )}

      {sorted.length > 0 && (
        <div className="d-lg-none d-flex flex-column gap-2 mt-3">
          {pageItems.map((repo) => (
            <RepositoryCard
              key={repo.full_name}
              repo={repo}
              selected={selection.has(repo.full_name)}
              onToggle={() => toggleSelection(repo.full_name)}
              onOpen={openDetails}
            />
          ))}
        </div>
      )}

      {selectedRepos.length > 0 && !op.active && (
        <SelectionToolbar
          count={selectedRepos.length}
          onArchive={() => setModal('archive')}
          onDelete={() => setModal('delete')}
          onClear={clearSelection}
        />
      )}

      {sorted.length > 0 && (
        <div className="repo-pagination d-flex align-items-center justify-content-center flex-wrap gap-2 mt-3 rounded">
          {totalPages > 1 && (
            <nav aria-label="Repository pages" className="d-flex align-items-center justify-content-center gap-1 flex-grow-1">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                aria-label="Previous page"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                <i className="bi bi-chevron-left" aria-hidden="true" />
              </button>
              {pageNumbers(safePage, totalPages).map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="small text-muted-rs px-1">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    aria-label={`Page ${p}`}
                    aria-current={p === safePage ? 'page' : undefined}
                    className={`btn btn-sm page-btn ${p === safePage ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                aria-label="Next page"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
              >
                <i className="bi bi-chevron-right" aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>
      )}

      <RepositoryDetailsPanel
        repo={details}
        open={Boolean(details)}
        onClose={() => setDetails(null)}
        onToggleProtect={handleToggleProtect}
        protecting={protecting}
      />

      <DeleteConfirmationModal
        open={modal === 'delete' && !op.active}
        repos={selectedRepos}
        onClose={() => setModal(null)}
        submitting={op.active && op.action === 'delete'}
        onConfirm={() => runOperation('delete')}
      />
      <ArchiveConfirmationModal
        open={modal === 'archive' && !op.active}
        repos={selectedRepos}
        onClose={() => setModal(null)}
        submitting={op.active && op.action === 'archive'}
        onConfirm={() => runOperation('archive')}
      />

      <OperationFlow
        open={op.active || Boolean(op.manifest) || Boolean(op.error)}
        action={op.action}
        count={op.count}
        manifest={op.manifest}
        error={op.error}
        onClose={finishOp}
        onRetry={retryFailed}
        onViewActivity={() => {
          finishOp();
          navigate('/app/activity');
        }}
      />
    </>
  );
}