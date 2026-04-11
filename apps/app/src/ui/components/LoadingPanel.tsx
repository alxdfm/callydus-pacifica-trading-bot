type LoadingPanelProps = {
  title: string;
  message?: string | null;
  compact?: boolean;
};

export function LoadingPanel({ title, message, compact = false }: LoadingPanelProps) {
  return (
    <section className={`page-card loading-panel${compact ? " loading-panel--compact" : ""}`}>
      <div className="loading-panel__spinner" aria-hidden="true" />
      <div className="loading-panel__copy">
        <strong>{title}</strong>
        {message ? <p>{message}</p> : null}
      </div>
    </section>
  );
}
