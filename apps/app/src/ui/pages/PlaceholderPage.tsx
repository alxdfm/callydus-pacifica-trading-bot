import { useI18n } from "../../shared/i18n/I18nProvider";
import type { MessageKey } from "../../shared/i18n/messages";

type PlaceholderPageProps = {
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  actionKey: MessageKey;
};

export function PlaceholderPage({ titleKey, descriptionKey, actionKey }: PlaceholderPageProps) {
  const { t } = useI18n();

  return (
    <section className="page-card">
      <header className="page-card__header">
        <div>
          <p className="page-card__eyebrow">{t("pageStatusLabel")}</p>
          <h3>{t(titleKey)}</h3>
        </div>
        <span className="page-card__badge">{t("pageStatusPlaceholder")}</span>
      </header>

      <p className="page-card__description">{t(descriptionKey)}</p>

      <div className="page-card__next-step">
        <span>{t("pageActionLabel")}</span>
        <strong>{t(actionKey)}</strong>
      </div>
    </section>
  );
}
