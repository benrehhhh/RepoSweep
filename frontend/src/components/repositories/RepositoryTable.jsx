import RepositoryRow from './RepositoryRow.jsx';

export default function RepositoryTable({ repos, selected, onToggle, onTogglePage, onOpen }) {
  const pageSelected = repos.length > 0 && repos.every((r) => selected.has(r.full_name));
  const someSelected = repos.some((r) => selected.has(r.full_name));

  return (
    <div className="repo-table-wrap">
      <div className="table-responsive">
        <table className="table repo-table align-middle mb-0">
          <thead>
            <tr>
              <th style={{ width: 40 }} className="text-center">
                <input
                  type="checkbox"
                  className="form-check-input mt-0"
                  aria-label={pageSelected ? 'Deselect all repositories on this page' : 'Select all repositories on this page'}
                  checked={pageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !pageSelected;
                  }}
                  onChange={onTogglePage}
                />
              </th>
              <th>Repository</th>
              <th>Visibility</th>
              <th>Language</th>
              <th>Updated</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {repos.map((repo) => (
              <RepositoryRow
                key={repo.full_name}
                repo={repo}
                selected={selected.has(repo.full_name)}
                onToggle={() => onToggle(repo.full_name)}
                onOpen={onOpen}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}