import Dropdown, { DropdownSection } from '../common/Dropdown.jsx';

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', hint: 'Updated in the last 90 days' },
  { value: 'potentially-inactive', label: 'Potentially inactive', hint: '90 – 365 days' },
  { value: 'long-inactive', label: 'No recent activity', hint: 'More than 1 year' },
  { value: 'archived', label: 'Archived', hint: 'Read-only on GitHub' },
];

export const UPDATED_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '3-6m', label: '3 – 6 months' },
  { value: '6-12m', label: '6 – 12 months' },
  { value: '1y+', label: 'More than 1 year' },
];

function GroupToggle({ label, icon, count = 0 }) {
  return (
    <>
      <i className={`bi ${icon}`} aria-hidden="true" />
      {label}
      {count > 0 && <span className="badge text-bg-accent ms-1" style={{ background: 'var(--rs-accent)', fontSize: 10 }}>{count}</span>}
      <i className="bi bi-chevron-down ms-auto small" aria-hidden="true" />
    </>
  );
}

export default function RepositoryFilters({
  filters,
  onChange,
  languages,
  activeCount,
}) {
  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  const updatedLabel =
    UPDATED_OPTIONS.find((o) => o.value === filters.updated)?.label || 'All time';

  return (
    <div className="d-flex flex-wrap align-items-center gap-1">
      <Dropdown
        toggle={<GroupToggle icon="bi-activity" label="Status" count={filters.status !== 'all' ? 1 : 0} />}
        menuClassName="position-absolute start-0 w-100"
        className="flex-grow-0"
      >
        <DropdownSection label="Activity">
          <MenuItem active={filters.status === 'all'} onClick={() => set('status', 'all')}>
            All statuses
          </MenuItem>
          {STATUS_OPTIONS.map((opt) => (
            <MenuItem
              key={opt.value}
              active={filters.status === opt.value}
              onClick={() => set('status', opt.value)}
              hint={opt.hint}
            >
              {opt.label}
            </MenuItem>
          ))}
        </DropdownSection>
      </Dropdown>

      <Dropdown
        toggle={<GroupToggle icon="bi-eye" label="Visibility" count={filters.visibility !== 'all' ? 1 : 0} />}
        menuClassName="position-absolute start-0 w-100"
      >
        <MenuItem active={filters.visibility === 'all'} onClick={() => set('visibility', 'all')}>
          All visibility
        </MenuItem>
        <MenuItem active={filters.visibility === 'public'} onClick={() => set('visibility', 'public')}>
          Public
        </MenuItem>
        <MenuItem active={filters.visibility === 'private'} onClick={() => set('visibility', 'private')}>
          Private
        </MenuItem>
      </Dropdown>

      <Dropdown
        toggle={<GroupToggle icon="bi-code-slash" label="Language" count={filters.language !== 'all' ? 1 : 0} />}
        menuClassName="position-absolute start-0 w-100"
      >
        <MenuItem active={filters.language === 'all'} onClick={() => set('language', 'all')}>
          All languages
        </MenuItem>
        {languages.map((lang) => (
          <MenuItem
            key={lang}
            active={filters.language === lang}
            onClick={() => set('language', lang)}
          >
            {lang}
          </MenuItem>
        ))}
      </Dropdown>

      <Dropdown
        toggle={<GroupToggle icon="bi-clock-history" label={`Updated · ${filters.updated === 'all' ? 'All time' : updatedLabel}`} />}
        menuClassName="position-absolute start-0 w-100"
      >
        <MenuItem active={filters.updated === 'all'} onClick={() => set('updated', 'all')}>
          All time
        </MenuItem>
        {UPDATED_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} active={filters.updated === opt.value} onClick={() => set('updated', opt.value)}>
            {opt.label}
          </MenuItem>
        ))}
      </Dropdown>

      <Dropdown
        toggle={<GroupToggle icon="bi-diagram-3" label="Forks" count={filters.fork !== 'all' ? 1 : 0} />}
        menuClassName="position-absolute start-0 w-100"
      >
        <MenuItem active={filters.fork === 'all'} onClick={() => set('fork', 'all')}>
          All repositories
        </MenuItem>
        <MenuItem active={filters.fork === 'original'} onClick={() => set('fork', 'original')}>
          Original repositories
        </MenuItem>
        <MenuItem active={filters.fork === 'fork'} onClick={() => set('fork', 'fork')}>
          Forks
        </MenuItem>
      </Dropdown>

      {(activeCount > 0 || filters.updated !== 'all') && (
        <button
          type="button"
          className="btn btn-ghost btn-sm text-muted-rs"
          onClick={() =>
            onChange({
              status: 'all',
              visibility: 'all',
              language: 'all',
              updated: 'all',
              fork: 'all',
            })
          }
        >
          <i className="bi bi-x-circle me-1" aria-hidden="true" />
          Clear filters
        </button>
      )}
    </div>
  );
}

function MenuItem({ active, onClick, children, hint }) {
  return (
    <button
      type="button"
      className={`dropdown-item w-100 text-start d-flex align-items-center gap-2 ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <i className={`bi bi-check ${active ? '' : 'invisible'}`} aria-hidden="true" />
      <span className="d-flex flex-column">
        <span>{children}</span>
        {hint && (
          <span className="small" style={{ color: 'var(--rs-text-muted)', fontSize: 11.5 }}>
            {hint}
          </span>
        )}
      </span>
    </button>
  );
}