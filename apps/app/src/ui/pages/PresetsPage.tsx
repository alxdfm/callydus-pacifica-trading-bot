import {
  presetActivationRequestSchema,
  type MarketInfoItem,
  type PresetBacktestCurvePoint,
  type PresetBacktestPreviewResponse,
  type PresetBacktestPreviewSuccess,
} from "@pacifica/contracts";
import { useEffect, useMemo, useState } from "react";
import { activatePreset } from "../../features/presets/preset-activation";
import { previewPresetBacktestViaBackend } from "../../features/presets/backend-backtest-preview";
import {
  allowedPresetSymbols,
  getEditableConfigForPreset,
  getPresetCatalog,
  getPresetCatalogItemByDefinitionId,
} from "../../features/presets/preset-catalog";
import {
  getMarketInfoViaBackend,
} from "../../features/runtime/backend-runtime-config";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";

export function PresetsPage() {
  const { t } = useI18n();
  const { canAccessProduct, setPresetState, setRuntimeState, state } = useAppState();
  const presets = getPresetCatalog(t);
  const selectedPresetDefinitionId = state.presets.selectedPresetDefinitionId;
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isBacktestLoading, setIsBacktestLoading] = useState(false);
  const [backtestPreview, setBacktestPreview] =
    useState<PresetBacktestPreviewResponse | null>(null);
  const [marketInfo, setMarketInfo] = useState<MarketInfoItem[]>([]);
  const selectedPreset = useMemo(
    () => getPresetCatalogItemByDefinitionId(selectedPresetDefinitionId, t),
    [selectedPresetDefinitionId, t],
  );

  const draftConfig = useMemo(() => {
    if (!selectedPresetDefinitionId) {
      return null;
    }

    return (
      state.presets.draftEditableConfig ??
      getEditableConfigForPreset(
        selectedPresetDefinitionId,
        state.presets.activePreset,
      )
    );
  }, [
    state.presets.activePreset,
    state.presets.draftEditableConfig,
    selectedPresetDefinitionId,
  ]);

  const activationSummary =
    selectedPreset && draftConfig
      ? selectedPreset.activationSummary(draftConfig)
      : t("presetActivationSummaryEmpty");

  const selectedMarketInfo = useMemo(
    () => marketInfo.find((item) => item.symbol === draftConfig?.symbol.split("/")[0]),
    [draftConfig?.symbol, marketInfo],
  );
  const selectedSymbolConfig = useMemo(
    () =>
      state.runtime.symbolOperationalConfigs.find(
        (config) => config.symbol === draftConfig?.symbol,
      ) ?? null,
    [draftConfig?.symbol, state.runtime.symbolOperationalConfigs],
  );
  const selectedLeverage =
    selectedSymbolConfig?.leverage ?? selectedMarketInfo?.maxLeverage ?? null;
  const initialCapitalUsd =
    state.runtime.balance?.availableBalance ??
    state.runtime.balance?.totalBalance ??
    1000;
  const backtestRequestKey = useMemo(() => {
    if (!selectedPreset || !draftConfig) {
      return null;
    }

    return JSON.stringify({
      presetDefinitionId: selectedPreset.definition.id,
      symbol: draftConfig.symbol,
      positionSizeValue: draftConfig.positionSizeValue,
      longEnabled: draftConfig.longEnabled,
      shortEnabled: draftConfig.shortEnabled,
      initialCapitalUsd,
      leverage: selectedLeverage ?? 1,
    });
  }, [draftConfig, initialCapitalUsd, selectedLeverage, selectedPreset]);

  useEffect(() => {
    void (async () => {
      const result = await getMarketInfoViaBackend();

      if (result.status === "success") {
        setMarketInfo(result.markets);
      }
    })();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    if (!selectedPreset || !draftConfig) {
      setBacktestPreview(null);
      setIsBacktestLoading(false);
      return;
    }

    const period = getPresetBacktestPeriod();

    setIsBacktestLoading(true);

    void (async () => {
      const result = await previewPresetBacktestViaBackend({
        presetDefinitionId: selectedPreset.definition.id,
        editableConfig: draftConfig,
        priceSource: "market",
        startTime: period.startTime,
        endTime: period.endTime,
        initialCapitalUsd,
        leverage: selectedLeverage ?? 1,
        feePercent: 0.06,
        slippagePercent: 0.03,
      });

      if (isCancelled) {
        return;
      }

      setBacktestPreview(result);
      setIsBacktestLoading(false);
    })();

    return () => {
      isCancelled = true;
    };
  }, [backtestRequestKey, draftConfig, initialCapitalUsd, selectedLeverage, selectedPreset]);

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

          <section className="backtest-preview">
            <div className="row-between align-start section-gap">
              <div>
                <p className="panel-label">{t("presetBacktestEyebrow")}</p>
                <h3>{t("presetBacktestTitle")}</h3>
                <p className="panel-copy">
                  {selectedPreset
                    ? t("presetBacktestDescription")
                    : t("presetBacktestEmptyDescription")}
                </p>
              </div>
              <span className="badge badge--neutral">
                {selectedPreset
                  ? formatBacktestPeriodLabel(
                      backtestPreview?.status === "success"
                        ? backtestPreview
                        : null,
                    )
                  : t("presetBacktestBadgeIdle")}
              </span>
            </div>

            {!selectedPreset ? (
              <div className="info-note">
                <strong>{t("presetBacktestEmptyTitle")}</strong>
                <p>{t("presetBacktestEmptyDescription")}</p>
              </div>
            ) : isBacktestLoading ? (
              <div className="info-note">
                <strong>{t("presetBacktestLoadingTitle")}</strong>
                <p>{t("presetBacktestLoadingDescription")}</p>
              </div>
            ) : backtestPreview?.status === "success" ? (
              <div className="backtest-stack">
                <section className="metric-grid">
                  <article className="stat-panel emphasis">
                    <span>{t("presetBacktestMetricStrategy")}</span>
                    <strong
                      className={
                        backtestPreview.summary.strategyReturnPercent >= 0 ? "up" : "down"
                      }
                    >
                      {formatPercent(backtestPreview.summary.strategyReturnPercent)}
                    </strong>
                    <p>{t("presetBacktestMetricStrategyHint")}</p>
                  </article>
                  <article className="stat-panel">
                    <span>{t("presetBacktestMetricHold")}</span>
                    <strong
                      className={backtestPreview.summary.holdReturnPercent >= 0 ? "up" : "down"}
                    >
                      {formatPercent(backtestPreview.summary.holdReturnPercent)}
                    </strong>
                    <p>{t("presetBacktestMetricHoldHint")}</p>
                  </article>
                  <article className="stat-panel">
                    <span>{t("presetBacktestMetricAlpha")}</span>
                    <strong
                      className={backtestPreview.summary.alphaVsHoldPercent >= 0 ? "up" : "down"}
                    >
                      {formatPercent(backtestPreview.summary.alphaVsHoldPercent)}
                    </strong>
                    <p>{t("presetBacktestMetricAlphaHint")}</p>
                  </article>
                  <article className="stat-panel">
                    <span>{t("presetBacktestMetricDrawdown")}</span>
                    <strong className="down">
                      {formatPercent(backtestPreview.summary.maxDrawdownPercent)}
                    </strong>
                    <p>{t("presetBacktestMetricDrawdownHint")}</p>
                  </article>
                  <article className="stat-panel">
                    <span>{t("presetBacktestMetricWinRate")}</span>
                    <strong>{formatPercent(backtestPreview.summary.winRatePercent)}</strong>
                    <p>{t("presetBacktestMetricWinRateHint")}</p>
                  </article>
                  <article className="stat-panel">
                    <span>{t("presetBacktestMetricTrades")}</span>
                    <strong>{backtestPreview.summary.totalTrades}</strong>
                    <p>{t("presetBacktestMetricTradesHint")}</p>
                  </article>
                </section>

                <div className="backtest-chart-panel">
                  <div className="backtest-legend">
                    <span>
                      <i className="legend-swatch legend-swatch--strategy"></i>
                      {t("presetBacktestLegendStrategy")}
                    </span>
                    <span>
                      <i className="legend-swatch legend-swatch--hold"></i>
                      {t("presetBacktestLegendHold")}
                    </span>
                  </div>
                  <BacktestComparisonChart
                    holdCurve={backtestPreview.holdCurve}
                    strategyCurve={backtestPreview.equityCurve}
                  />
                </div>

                <div className="backtest-summary-bar">
                  <span>
                    {t("presetBacktestEndingEquity").replace(
                      "{value}",
                      formatCurrency(backtestPreview.summary.endingEquityUsd),
                    )}
                  </span>
                  <span>
                    {t("presetBacktestEndingHold").replace(
                      "{value}",
                      formatCurrency(backtestPreview.summary.endingHoldEquityUsd),
                    )}
                  </span>
                </div>

                <div className="backtest-trade-list">
                  <div className="row-between align-start section-gap">
                    <div>
                      <p className="panel-label">{t("presetBacktestTradesEyebrow")}</p>
                      <h4>{t("presetBacktestTradesTitle")}</h4>
                    </div>
                    <span className="badge badge--info">
                      {backtestPreview.trades.length}
                    </span>
                  </div>

                  {backtestPreview.trades.length > 0 ? (
                    <div className="history-stack">
                      {backtestPreview.trades.slice(0, 6).map((trade) => (
                        <article key={trade.id} className="history-card">
                          <div>
                            <div className="trade-head">
                              <strong>{backtestPreview.symbol}</strong>
                              <span
                                className={`badge badge--${
                                  trade.side === "long" ? "info" : "danger"
                                }`}
                              >
                                {trade.side === "long"
                                  ? t("tradeSideLong")
                                  : t("tradeSideShort")}
                              </span>
                              <span
                                className={`badge badge--${
                                  trade.realizedPnl >= 0 ? "success" : "danger"
                                }`}
                              >
                                {trade.closeReason === "take_profit"
                                  ? t("tradeCloseReasonTakeProfit")
                                  : trade.closeReason === "stop_loss"
                                    ? t("tradeCloseReasonStopLoss")
                                    : t("presetBacktestCloseEndOfPeriod")}
                              </span>
                            </div>
                            <p>
                              {new Date(trade.openedAt).toLocaleString("en-US", {
                                month: "short",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              · {formatTradePrice(trade.entryPrice)} →{" "}
                              {formatTradePrice(trade.exitPrice)}
                            </p>
                          </div>
                          <div>
                            <span className="trade-label">
                              {t("historyResultLabel")}
                            </span>
                            <strong className={trade.realizedPnl >= 0 ? "up" : "down"}>
                              {formatSignedCurrency(trade.realizedPnl)}
                            </strong>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="info-note">
                      <strong>{t("presetBacktestTradesEmptyTitle")}</strong>
                      <p>{t("presetBacktestTradesEmptyDescription")}</p>
                    </div>
                  )}
                </div>

                <div className="backtest-assumptions">
                  <strong>{t("presetBacktestAssumptionsTitle")}</strong>
                  <p>{backtestPreview.assumptions.executionModel}</p>
                  <p>{backtestPreview.assumptions.positionRule}</p>
                  <p>{backtestPreview.assumptions.tpSlConflictRule}</p>
                </div>
              </div>
            ) : backtestPreview ? (
              <div className="info-note">
                <strong>{t("presetBacktestErrorTitle")}</strong>
                <p>{backtestPreview.message}</p>
              </div>
            ) : null}
          </section>
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

                <label className="onboarding-form__field">
                  <span>{t("presetReviewLeverageLabel")}</span>
                  <div className="onboarding-form__input" aria-readonly="true">
                    {selectedLeverage ? `${selectedLeverage}x` : "-"}
                  </div>
                  <small>{t("presetReviewLeverageHint")}</small>
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSignedCurrency(value: number) {
  return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatTradePrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function getPresetBacktestPeriod() {
  const endTime = Date.now();

  return {
    startTime: endTime - 7 * 24 * 60 * 60 * 1000,
    endTime,
  };
}

function formatBacktestPeriodLabel(backtestPreview: PresetBacktestPreviewSuccess | null) {
  if (!backtestPreview) {
    return "Auto range";
  }

  return `${new Date(backtestPreview.periodStart).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  })} - ${new Date(backtestPreview.periodEnd).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  })}`;
}

function BacktestComparisonChart(input: {
  strategyCurve: PresetBacktestCurvePoint[];
  holdCurve: PresetBacktestCurvePoint[];
}) {
  const width = 860;
  const height = 240;
  const padding = 18;
  const values = [...input.strategyCurve, ...input.holdCurve].map((point) => point.equity);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const yRange = Math.max(max - min, 1);

  const strategyPath = buildChartPath({
    points: input.strategyCurve,
    width,
    height,
    padding,
    min,
    yRange,
  });
  const holdPath = buildChartPath({
    points: input.holdCurve,
    width,
    height,
    padding,
    min,
    yRange,
  });

  return (
    <svg
      aria-label="Preset backtest comparison chart"
      className="backtest-chart"
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
    >
      <path className="backtest-chart__grid" d={`M ${padding} ${height - padding} H ${width - padding}`} />
      <path className="backtest-chart__grid" d={`M ${padding} ${padding} H ${width - padding}`} />
      <path className="backtest-chart__line backtest-chart__line--hold" d={holdPath} />
      <path
        className="backtest-chart__line backtest-chart__line--strategy"
        d={strategyPath}
      />
    </svg>
  );
}

function buildChartPath(input: {
  points: PresetBacktestCurvePoint[];
  width: number;
  height: number;
  padding: number;
  min: number;
  yRange: number;
}) {
  if (input.points.length === 0) {
    return "";
  }

  return input.points
    .map((point, index) => {
      const x =
        input.padding +
        (index / Math.max(input.points.length - 1, 1)) *
          (input.width - input.padding * 2);
      const y =
        input.height -
        input.padding -
        ((point.equity - input.min) / input.yRange) *
          (input.height - input.padding * 2);

      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
