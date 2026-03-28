import { presetActivationRequestSchema } from "@pacifica/contracts";
import { useMemo, useState } from "react";
import { activatePreset } from "../../features/presets/preset-activation";
import {
  allowedPresetSymbols,
  getEditableConfigForPreset,
  getPresetCatalog,
  getPresetCatalogItemByDefinitionId,
} from "../../features/presets/preset-catalog";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";

export function PresetsPage() {
  const { t } = useI18n();
  const { canAccessProduct, setPresetState, setRuntimeState, state } = useAppState();
  const presets = getPresetCatalog(t);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const selectedPreset = getPresetCatalogItemByDefinitionId(
    state.presets.selectedPresetDefinitionId,
    t,
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
      setRuntimeState({
        screenStatus: "loading",
        lastRuntimeMessage: t("runtimeStatusLoading"),
      });

      const request = presetActivationRequestSchema.parse({
        walletAddress: state.wallet.mainWalletPublicKey,
        presetDefinitionId: selectedPreset.definition.id,
        editableConfig: draftConfig,
      });

      const result = await activatePreset(request);

      setPresetState({
        activePreset: result.activation,
        selectedPresetDefinitionId: selectedPreset.definition.id,
        draftEditableConfig: result.activation.editableConfig,
        activationStatus: "success",
        activationMessage: result.message,
      });
      setRuntimeState({
        botStatus: result.runtime.botStatus,
        syncStatus: result.runtime.syncStatus,
        screenStatus: "ready",
        lastRuntimeMessage: result.message,
      });
    } catch {
      setPresetState({
        activationStatus: "error",
        activationMessage: t("presetActivationErrorGeneric"),
      });
      setRuntimeState({
        screenStatus: "error",
        lastRuntimeMessage: t("presetActivationErrorGeneric"),
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

  function handleActivationRequest() {
    if (!selectedPreset || !draftConfig) {
      void handleActivatePreset();
      return;
    }

    setIsActivationModalOpen(true);
  }

  return (
    <div className="page-stack">
      <ConfirmationModal
        cancelLabel={t("modalCancelAction")}
        confirmLabel={t("presetActivationAction")}
        description={
          selectedPreset && draftConfig
            ? t("presetActivationConfirmDescription")
              .replace("{preset}", selectedPreset.definition.name)
              .replace("{symbol}", draftConfig.symbol)
            : t("presetActivationSummaryEmpty")
        }
        isOpen={isActivationModalOpen}
        onCancel={() => setIsActivationModalOpen(false)}
        onConfirm={() => {
          setIsActivationModalOpen(false);
          void handleActivatePreset();
        }}
        title={t("presetActivationConfirmTitle")}
      />
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
                  <div className="preset-disclosure">
                    <button
                      aria-label={t("presetDisclosureInfoAction")}
                      className="preset-disclosure__trigger"
                      type="button"
                    >
                      i
                    </button>
                    <div className="preset-disclosure__panel">
                      <div className="detail-item">
                        <span>{t("presetDisclosureBuyLabel")}</span>
                        <strong>{preset.triggerDetails.buy}</strong>
                      </div>
                      <div className="detail-item">
                        <span>{t("presetDisclosureSellLabel")}</span>
                        <strong>{preset.triggerDetails.sell}</strong>
                      </div>
                      <div className="detail-item">
                        <span>{t("presetDisclosureStopLabel")}</span>
                        <strong>{preset.triggerDetails.stopLoss}</strong>
                      </div>
                      <div className="detail-item">
                        <span>{t("presetDisclosureTakeProfitLabel")}</span>
                        <strong>{preset.triggerDetails.takeProfit}</strong>
                      </div>
                    </div>
                  </div>

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
                  <select
                    className="onboarding-form__input"
                    onChange={(event) => updateDraftConfig("symbol", event.target.value)}
                    value={draftConfig.symbol}
                  >
                    {allowedPresetSymbols.map((symbol) => (
                      <option key={symbol} value={symbol}>
                        {symbol}
                      </option>
                    ))}
                  </select>
                  <small>{t("presetReviewSymbolHint")}</small>
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
            <div className="info-note">
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
              disabled={
                !canAccessProduct ||
                !selectedPreset ||
                !draftConfig ||
                state.presets.activationStatus === "loading"
              }
              onClick={handleActivationRequest}
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
