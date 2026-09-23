export default function SelectionToolbar({ count, onArchive, onDelete, onClear }) {
  return (
    <div
      className="selection-bar"
      role="toolbar"
      aria-label="Bulk actions"
      style={{ maxWidth: 'calc(100% - 32px)', marginLeft: 'auto', marginRight: 'auto' }}
    >
      <span className="selection-count">
        {count} {count === 1 ? 'repository' : 'repositories'} selected
      </span>
      <span className="flex-grow-1" />
      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onArchive}>
        <i className="bi bi-archive me-1" aria-hidden="true" />
        Archive
      </button>
      <button type="button" className="btn btn-outline-danger btn-sm" onClick={onDelete}>
        <i className="bi bi-trash me-1" aria-hidden="true" />
        Delete
      </button>
      <button type="button" className="btn btn-ghost btn-sm text-muted-rs" onClick={onClear}>
        <i className="bi bi-x-circle me-1" aria-hidden="true" />
        Clear
      </button>
    </div>
  );
}