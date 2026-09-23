import Dropdown from '../common/Dropdown.jsx';

const SORT_OPTIONS = [
  { value: 'updated', label: 'Recently updated', icon: 'bi-clock-history' },
  { value: 'name', label: 'Name', icon: 'bi-sort-alpha-down' },
  { value: 'created', label: 'Created date', icon: 'bi-calendar-plus' },
  { value: 'stars', label: 'Stars', icon: 'bi-star' },
  { value: 'size', label: 'Size', icon: 'bi-hdd' },
];

export default function SortMenu({ sort, onChange }) {
  const current = SORT_OPTIONS.find((o) => o.value === sort.key);

  function Item({ option }) {
    return (
      <button
        type="button"
        className={`dropdown-item w-100 text-start d-flex align-items-center gap-2 ${sort.key === option.value ? 'active' : ''}`}
        onClick={() => onChange({ ...sort, key: option.value })}
      >
        <i className={`bi ${option.icon}`} aria-hidden="true" />
        {option.label}
      </button>
    );
  }

  return (
    <div className="d-flex align-items-center gap-1">
      <Dropdown
        toggle={
          <span className="d-inline-flex align-items-center gap-1">
            <i className="bi arrow-down-up" aria-hidden="true" />
            Sort: {current?.label || 'Updated'}
          </span>
        }
        menuClassName="position-absolute end-0"
      >
        {SORT_OPTIONS.map((option) => (
          <Item key={option.value} option={option} />
        ))}
      </Dropdown>
      <button
        type="button"
        className="btn btn-outline-secondary btn-ghost"
        aria-label={sort.dir === 'desc' ? 'Sort descending; switch to ascending' : 'Sort ascending; switch to descending'}
        title={sort.dir === 'desc' ? 'Descending' : 'Ascending'}
        onClick={() => onChange({ ...sort, dir: sort.dir === 'desc' ? 'asc' : 'desc' })}
      >
        <i
          className={`bi ${sort.dir === 'desc' ? 'bi-sort-down' : 'bi-sort-up'}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}