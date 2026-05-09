type PaginationControlsProps = {
  page: number;
  totalPages: number;
  previousLabel: string;
  nextLabel: string;
  summary: string;
  onPageChange: (page: number) => void;
};

export function PaginationControls(props: PaginationControlsProps) {
  const {
    nextLabel,
    onPageChange,
    page,
    previousLabel,
    summary,
    totalPages,
  } = props;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-controls">
      <span className="pagination-controls__summary">{summary}</span>
      <div className="pagination-controls__actions">
        <button
          className="btn secondary small"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          {previousLabel}
        </button>
        <button
          className="btn secondary small"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
