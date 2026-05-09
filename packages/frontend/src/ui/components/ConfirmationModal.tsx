import { useEffect } from "react";
import { useI18n } from "../../shared/i18n/I18nProvider";

type ConfirmationModalProps = {
  isOpen: boolean;
  tone?: "danger" | "info";
  showBadge?: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  isOpen,
  tone = "info",
  showBadge = true,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onCancel} role="presentation">
      <div
        aria-modal="true"
        className={`modal-card modal-card--${tone}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal-copy">
          {showBadge ? (
            <span className={`badge badge--${tone === "danger" ? "danger" : "info"}`}>
              {tone === "danger" ? t("modalSensitiveBadge") : t("modalConfirmBadge")}
            </span>
          ) : null}
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <div className="action-row modal-actions">
          <button className="btn secondary" onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button
            className={`btn ${tone === "danger" ? "danger" : "primary"}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
