import { getPresetCatalogItemByDefinitionId } from "../../features/presets/preset-catalog";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";
import { PlaceholderPage } from "./PlaceholderPage";

export function DashboardPage() {
  const { state } = useAppState();
  const { t } = useI18n();
  const activePresetItem = getPresetCatalogItemByDefinitionId(
    state.presets.activePreset?.presetDefinitionId,
  );

  return (
    <div className="page-stack">
      <section className="page-card">
        <header className="page-card__header">
          <div>
            <p className="page-card__eyebrow">{t("presetDashboardEyebrow")}</p>
            <h3>{activePresetItem ? activePresetItem.definition.name : t("presetSidebarTitle")}</h3>
            <p className="page-card__description">
              {activePresetItem
                ? `${activePresetItem.definition.riskLabel} · ${state.presets.activePreset?.editableConfig.symbol ?? activePresetItem.defaultEditableConfig.symbol}`
                : t("presetDashboardEmpty")}
            </p>
          </div>
          <span className={`badge badge--${activePresetItem ? "warning" : "neutral"}`}>
            {activePresetItem ? t("presetSidebarActive") : t("presetSidebarEmpty")}
          </span>
        </header>
      </section>

      <PlaceholderPage
        titleKey="pageDashboardTitle"
        descriptionKey="pageDashboardDescription"
        actionKey="pageDashboardAction"
      />
    </div>
  );
}
