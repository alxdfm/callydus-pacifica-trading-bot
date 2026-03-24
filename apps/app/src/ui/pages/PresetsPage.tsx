import { presetActivationRequestSchema } from "@pacifica/contracts";
import { useMemo } from "react";
import { activatePresetLocally } from "../../features/presets/preset-activation";
import {
  getEditableConfigForPreset,
  getPresetCatalog,
  getPresetCatalogItemByDefinitionId,
} from "../../features/presets/preset-catalog";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";

export function PresetsPage() {
  const { t } = useI18n();
  const { setPresetState, state } = useAppState();
  const presets = getPresetCatalog();
  const selectedPreset = getPresetCatalogItemByDefinitionId(
    state.presets.selectedPresetDefinitionId,
  );

  const draftConfig = useMemo(() => {
    if (!state.presets.selectedPresetDefinitionId) {
      return null;
    }

    return (
      state.presets.draftEditableConfig ??
      getEditableConfigForPreset(
        state.presets.selectedPresetDefinitionId,
        state.presets.activePreset,
      )
    );
  }, [
    state.presets.activePreset,
    state.presets.draftEditableConfig,
    state.presets.selectedPresetDefinitionId,
  ]);

  const activationSummary =
    selectedPreset && draftConfig
      ? selectedPreset.activationSummary(draftConfig)
      : t("presetActivationSummaryEmpty");

  function handleSelectPreset(presetDefinitionId: string) {
    setPresetState({
      selectedPresetDefinitionId: presetDefinitionId,
      draftEditableConfig: getEditableConfigForPreset(
        presetDefinitionId,
        state.presets.activePreset,
      ),
      activationStatus: "idle",
      activationMessage: null,
    });
  }

  function updateDraftConfig(
    field: "symbol" | "positionSizeValue" | "longEnabled" | "shortEnabled",
    value: string | number | boolean,
  ) {
    if (!draftConfig) {
      return;
    }

    setPresetState({
      draftEditableConfig: {
        ...draftConfig,
        [field]: value,
      },
      activationStatus: "idle",
      activationMessage: null,
    });
  }

  async function handleActivatePreset() {
    if (!selectedPreset || !draftConfig) {
      setPresetState({
        activationStatus: "error",
        activationMessage: t("presetActivationErrorNoSelection"),
      });
      return;
    }

    try {
      setPresetState({
        activationStatus: "loading",
        activationMessage: t("presetActivationLoading"),
      });

      const request = presetActivationRequestSchema.parse({
        presetDefinitionId: selectedPreset.definition.id,
        editableConfig: draftConfig,
      });

      const result = await activatePresetLocally(request, state.credentials.credentialId);

      setPresetState({
        activePreset: result.activation,
        selectedPresetDefinitionId: selectedPreset.definition.id,
        draftEditableConfig: result.activation.editableConfig,
        activationStatus: "success",
        activationMessage: t("presetActivationSuccess"),
      });
    } catch {
      setPresetState({
        activationStatus: "error",
        activationMessage: t("presetActivationErrorGeneric"),
      });
    }
  }

  function handleCancelSelection() {
    setPresetState({
      selectedPresetDefinitionId: null,
      draftEditableConfig: null,
      activationStatus: "idle",
      activationMessage: null,
    });
  }

  return (
    <div className="page-stack">
      <section className="page-card">
        <header className="page-card__header">
          <div>
            <p className="page-card__eyebrow">{t("pagePresetsTitle")}</p>
            <h3>{t("presetPageTitle")}</h3>
            <p className="page-card__description">{t("presetPageDescription")}</p>
          </div>
          <span className="badge badge--neutral">{t("presetPageBadge")}</span>
        </header>
      </section>

      <section className="preset-layout">
        <section className="panel preset-stage">
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("presetChoiceEyebrow")}</p>
              <h3>{t("presetChoiceTitle")}</h3>
              <p className="panel-copy">{t("presetChoiceDescription")}</p>
            </div>
            <span className="badge badge--info">{t("presetChoiceBadge")}</span>
          </div>

          <div className="preset-showcase">
            {presets.map((preset) => {
              const isSelected = state.presets.selectedPresetDefinitionId === preset.definition.id;

              return (
                <article
                  key={preset.definition.id}
                  className={`preset-card-lite ${isSelected ? "featured" : ""}`}
                >
                  <div className="row-between align-start">
                    <div>
                      <h4>{preset.definition.name}</h4>
                      <p>{preset.definition.description}</p>
                    </div>
                    <span className={`badge badge--${preset.riskTone}`}>
                      {preset.definition.riskLabel}
                    </span>
                  </div>

                  <div className="chip-row compact">
                    <span className="chip">{preset.definition.frequencyLabel}</span>
                    <span className="chip">{preset.timeframeLabel}</span>
                  </div>

                  <ul className="preset-priority-list">
                    {preset.priorities.map((priority) => (
                      <li key={priority}>{priority}</li>
                    ))}
                  </ul>

                  <button
                    className={`btn ${isSelected ? "primary" : "secondary"} small`}
                    onClick={() => handleSelectPreset(preset.definition.id)}
                    type="button"
                  >
                    {isSelected ? t("presetSelectSelected") : t("presetSelectAction")}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel compare-panel">
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("presetCompareEyebrow")}</p>
              <h3>{t("presetCompareTitle")}</h3>
              <p className="panel-copy">{t("presetCompareDescription")}</p>
            </div>
          </div>

          <div className="compare-grid">
            <div className="compare-cell head">{t("presetCompareHeaderPreset")}</div>
            <div className="compare-cell head">{t("presetCompareHeaderRisk")}</div>
            <div className="compare-cell head">{t("presetCompareHeaderFrequency")}</div>
            <div className="compare-cell head">{t("presetCompareHeaderStyle")}</div>
            <div className="compare-cell head">{t("presetCompareHeaderStop")}</div>
            <div className="compare-cell head">{t("presetCompareHeaderTakeProfit")}</div>

            {presets.flatMap((preset) => {
              const isSelected = state.presets.selectedPresetDefinitionId === preset.definition.id;
              const cellClassName = isSelected ? "compare-cell active" : "compare-cell";

              return [
                <div key={`${preset.definition.id}-name`} className={cellClassName}>
                  {preset.definition.name}
                </div>,
                <div key={`${preset.definition.id}-risk`} className={cellClassName}>
                  {preset.comparison.risk}
                </div>,
                <div key={`${preset.definition.id}-frequency`} className={cellClassName}>
                  {preset.comparison.frequency}
                </div>,
                <div key={`${preset.definition.id}-style`} className={cellClassName}>
                  {preset.comparison.style}
                </div>,
                <div key={`${preset.definition.id}-stop`} className={cellClassName}>
                  {preset.comparison.stop}
                </div>,
                <div key={`${preset.definition.id}-tp`} className={cellClassName}>
                  {preset.comparison.takeProfit}
                </div>,
              ];
            })}
          </div>
        </section>

        <section className="panel review-panel-wide">
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("presetReviewEyebrow")}</p>
              <h3>{selectedPreset ? selectedPreset.definition.name : t("presetReviewEmptyTitle")}</h3>
              <p className="subtle">
                {selectedPreset ? selectedPreset.reviewSummary : t("presetReviewEmptyDescription")}
              </p>
            </div>
            <span className={`badge badge--${selectedPreset?.riskTone ?? "neutral"}`}>
              {selectedPreset ? selectedPreset.definition.riskLabel : t("presetReviewEmptyBadge")}
            </span>
          </div>

          {selectedPreset && draftConfig ? (
            <div className="form-split">
              <div className="form-stack">
                <label className="onboarding-form__field">
                  <span>{t("presetReviewSymbolLabel")}</span>
                  <input
                    className="onboarding-form__input"
                    onChange={(event) => updateDraftConfig("symbol", event.target.value)}
                    value={draftConfig.symbol}
                  />
                </label>

                <label className="onboarding-form__field">
                  <span>{t("presetReviewPositionSizeLabel")}</span>
                  <div className="position-size-field">
                    <input
                      className="onboarding-form__input"
                      min={1}
                      onChange={(event) =>
                        updateDraftConfig("positionSizeValue", Number(event.target.value))
                      }
                      type="number"
                      value={draftConfig.positionSizeValue}
                    />
                    <span className="position-size-suffix">%</span>
                  </div>
                </label>
              </div>

              <div className="toggle-box">
                <div className="toggle-row">
                  <span>{t("presetReviewLongLabel")}</span>
                  <button
                    aria-pressed={draftConfig.longEnabled}
                    className={`toggle ${draftConfig.longEnabled ? "on" : "off"}`}
                    onClick={() => updateDraftConfig("longEnabled", !draftConfig.longEnabled)}
                    type="button"
                  >
                    <span className="toggle__thumb"></span>
                  </button>
                </div>

                <div className="toggle-row">
                  <span>{t("presetReviewShortLabel")}</span>
                  <button
                    aria-pressed={draftConfig.shortEnabled}
                    className={`toggle ${draftConfig.shortEnabled ? "on" : "off"}`}
                    onClick={() => updateDraftConfig("shortEnabled", !draftConfig.shortEnabled)}
                    type="button"
                  >
                    <span className="toggle__thumb"></span>
                  </button>
                </div>

                <p className="subtle">{t("presetReviewHint")}</p>
                <p className="subtle">{t("presetSuggestionNote")}</p>
              </div>
            </div>
          ) : (
            <div className="empty-note">
              <strong>{t("presetReviewBlockedTitle")}</strong>
              <p>{t("presetReviewBlockedDescription")}</p>
            </div>
          )}
        </section>

        <section className="panel activation-panel">
          <div>
            <p className="panel-label">{t("presetActivationEyebrow")}</p>
            <h3>{selectedPreset ? t("presetActivationTitleReady") : t("presetActivationTitleIdle")}</h3>
            <p className="subtle">{activationSummary}</p>
          </div>

          <div className="status-stack">
            <div
              className={`status-row ${
                state.presets.activationStatus === "success"
                  ? "status-row--success"
                  : state.presets.activationStatus === "error"
                    ? "status-row--danger"
                    : state.presets.activationStatus === "loading"
                      ? "status-row--info"
                      : "status-row--neutral"
              }`}
            >
              <span
                className={`status-dot ${
                  state.presets.activationStatus === "success"
                    ? "status-dot--success"
                    : state.presets.activationStatus === "error"
                      ? "status-dot--danger"
                      : state.presets.activationStatus === "loading"
                        ? "status-dot--info"
                        : "status-dot--neutral"
                }`}
              ></span>
              <div>
                <strong>
                  {state.presets.activationStatus === "success"
                    ? t("presetActivationStatusSuccess")
                    : state.presets.activationStatus === "error"
                      ? t("presetActivationStatusError")
                      : state.presets.activationStatus === "loading"
                        ? t("presetActivationStatusLoading")
                        : t("presetActivationStatusIdle")}
                </strong>
                <p>{state.presets.activationMessage ?? t("presetActivationStatusIdleDescription")}</p>
              </div>
            </div>
          </div>

          <div className="action-row">
            <button className="btn secondary" onClick={handleCancelSelection} type="button">
              {t("presetActivationCancel")}
            </button>
            <button
              className="btn primary"
              disabled={!selectedPreset || !draftConfig || state.presets.activationStatus === "loading"}
              onClick={() => void handleActivatePreset()}
              type="button"
            >
              {t("presetActivationAction")}
            </button>
          </div>
        </section>
      </section>
    </div>
  );
}
