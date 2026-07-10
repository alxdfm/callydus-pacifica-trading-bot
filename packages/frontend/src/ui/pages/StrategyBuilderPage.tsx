import { useEffect, useMemo, useRef, useState } from "react";
import {
  marketSymbolSchema,
  strategyDraftSchema,
  type BacktestResponse,
  type IndicatorConfig,
  type StrategyDraft,
  type StrategyRecord,
  type TriggerRule,
} from "@pacifica/shared/contracts";
import { useAuth } from "../../features/auth/AuthContext";
import { useActionToast } from "../../features/runtime/use-action-toast";
import { useI18n } from "../../shared/i18n/I18nProvider";
import {
  activateStrategy,
  pauseStrategy,
  runBacktest,
  saveStrategy,
} from "../../v2/client";
import { validateDraftSemantics } from "../../v2/draft-validation";
import { useSession } from "../../v2/session";
import { LoadingPanel } from "../components/LoadingPanel";

// Aliases locais: o miolo da página (seções de indicadores/regras) foi escrito
// sobre os nomes do contrato v1 — os shapes são idênticos no v2
type PresetIndicatorConfig = IndicatorConfig;
type PresetTriggerRule = TriggerRule;
type YourStrategyDraft = StrategyDraft;
const presetSymbolSchema = marketSymbolSchema;

// ---------------------------------------------------------------------------
// Constantes e helpers puros
// ---------------------------------------------------------------------------

const TIMEFRAMES = ["3m", "5m", "15m"] as const;
const BACKTEST_PERIODS = [
  { days: 7, labelKey: "builderPeriod7d" },
  { days: 30, labelKey: "builderPeriod30d" },
  { days: 90, labelKey: "builderPeriod90d" },
] as const;

type IndicatorTypeOption = PresetIndicatorConfig["type"];

const INDICATOR_TYPES: { value: IndicatorTypeOption; label: string }[] = [
  { value: "ema", label: "EMA" },
  { value: "sma", label: "SMA" },
  { value: "rsi", label: "RSI" },
  { value: "atr", label: "ATR" },
  { value: "volume", label: "Volume" },
  { value: "donchian", label: "Donchian" },
  { value: "adx", label: "ADX" },
];

const THRESHOLD_OPERATORS = ["above", "below", "atOrAbove", "atOrBelow", "equal"] as const;
const CROSS_OPERATORS = ["crossesAbove", "crossesBelow"] as const;

const OPERATOR_LABELS: Record<string, string> = {
  above: "above",
  below: "below",
  atOrAbove: "at or above",
  atOrBelow: "at or below",
  equal: "equal to",
  crossesAbove: "crosses above",
  crossesBelow: "crosses below",
};

function describeIndicator(config: PresetIndicatorConfig): string {
  switch (config.type) {
    case "ema":
      return `EMA(${config.period})${config.source && config.source !== "close" ? ` · ${config.source}` : ""}`;
    case "sma":
      return `SMA(${config.period})${config.source !== "close" ? ` · ${config.source}` : ""}`;
    case "rsi":
      return `RSI(${config.period})`;
    case "atr":
      return `ATR(${config.period})`;
    case "volume":
      return "Volume";
    case "donchian":
      return `Donchian(${config.period}) · ${config.band}`;
    case "adx":
      return `ADX(${config.period})`;
  }
}

function suggestIndicatorKey(
  existing: Record<string, PresetIndicatorConfig>,
  config: PresetIndicatorConfig,
): string {
  const base = (() => {
    switch (config.type) {
      case "ema":
        return `EMA${config.period}`;
      case "sma":
        return `SMA${config.period}`;
      case "rsi":
        return `RSI${config.period}`;
      case "atr":
        return `ATR${config.period}`;
      case "volume":
        return "VOLUME";
      case "donchian":
        return `DONCH${config.period}${config.band.charAt(0).toUpperCase()}`;
      case "adx":
        return `ADX${config.period}`;
    }
  })();

  if (!existing[base]) {
    return base;
  }
  let suffix = 2;
  while (existing[`${base}_${suffix}`]) {
    suffix += 1;
  }
  return `${base}_${suffix}`;
}

function createDefaultDraft(): YourStrategyDraft {
  return {
    name: "YOUR Strategy",
    symbol: "BTC/USDC",
    timeframe: "5m",
    indicators: {
      EMA9: { type: "ema", period: 9 },
      EMA21: { type: "ema", period: 21 },
    },
    entry: {
      long: {
        enabled: true,
        trigger: {
          type: "all",
          rules: [
            {
              scope: "currentCandle",
              type: "cross",
              indicator: "EMA9",
              operator: "crossesAbove",
              ref: "EMA21",
            },
          ],
        },
      },
      short: {
        enabled: false,
        trigger: { type: "all", rules: [] },
      },
    },
    risk: {
      stopLoss: { mode: "static", unit: "percent", value: 3 },
      takeProfit: { mode: "rr", multiple: 2 },
    },
    positionSizeType: "balance_percent",
    positionSizeValue: 5,
  };
}

function draftFingerprint(draft: YourStrategyDraft): string {
  return JSON.stringify(draft);
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export function StrategyBuilderPage() {
  const { t } = useI18n();
  const { token } = useAuth();
  const showToast = useActionToast();
  const { session, status: sessionStatus, reload: reloadSession } = useSession();

  const [record, setRecord] = useState<StrategyRecord | null>(null);
  const [draft, setDraft] = useState<YourStrategyDraft | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(null);
  const [preview, setPreview] = useState<BacktestResponse | null>(null);
  const [previewFingerprint, setPreviewFingerprint] = useState<string | null>(null);
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [busy, setBusy] = useState<"save" | "activate" | "backtest" | "pause" | null>(null);
  const [statusTone, setStatusTone] = useState<"info" | "success" | "danger" | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // O draft local inicializa UMA vez a partir do snapshot de sessão; edições
  // subsequentes vivem só aqui até o save
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || sessionStatus !== "ready") return;
    initializedRef.current = true;

    const strategy = session?.strategy ?? null;

    if (strategy) {
      setRecord(strategy);
      setDraft(strategy.draft);
      setSavedFingerprint(draftFingerprint(strategy.draft));
      setStatusTone("info");
      setStatusMessage(t("builderLoadedFromSaved"));
    } else {
      setDraft(createDefaultDraft());
      setStatusTone("info");
      setStatusMessage(t("builderNoSavedDraft"));
    }
  }, [session, sessionStatus, t]);

  const isEditingBlocked = session?.strategy?.status === "active";
  const isStrategyActive = session?.strategy?.status === "active";

  // Paridade com a execução real: o worker dimensiona por notional sem
  // multiplicador de alavancagem, então o backtest usa leverage 1 e o saldo
  // real da conta como capital inicial. Saldo zerado (capital todo em posição)
  // cai no default — o contrato exige capital positivo
  const backtestLeverage = 1;
  const initialCapitalUsd =
    session?.balanceUsd != null && session.balanceUsd > 0
      ? session.balanceUsd
      : 1000;

  const validation = useMemo(
    () => (draft ? strategyDraftSchema.safeParse(draft) : null),
    [draft],
  );
  const semanticIssues = useMemo(
    () => (draft ? validateDraftSemantics(draft) : []),
    [draft],
  );
  const validationIssues: { path: string; message: string }[] = [
    ...(validation && !validation.success
      ? validation.error.issues
          .slice(0, 5)
          .map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      : []),
    ...semanticIssues.slice(0, 5),
  ];
  const isDraftValid = Boolean(validation?.success) && semanticIssues.length === 0;

  const fingerprint = draft ? draftFingerprint(draft) : null;
  const isDirty = fingerprint !== null && fingerprint !== savedFingerprint;
  const isPreviewStale =
    preview?.status === "ok" && fingerprint !== previewFingerprint;

  const hasEnabledRules =
    Boolean(draft) &&
    ((draft!.entry.long.enabled && draft!.entry.long.trigger.rules.length > 0) ||
      (draft!.entry.short.enabled && draft!.entry.short.trigger.rules.length > 0));
  const hasRisk =
    Boolean(draft?.risk.stopLoss) && draft?.risk.takeProfit !== null;

  // -------------------------------------------------------------------------
  // Mutations do draft
  // -------------------------------------------------------------------------

  function patchDraft(patch: Partial<YourStrategyDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function patchSide(
    side: "long" | "short",
    update: (rules: PresetTriggerRule[]) => PresetTriggerRule[],
    enabled?: boolean,
  ) {
    setDraft((current) => {
      if (!current) return current;
      const entrySide = current.entry[side];
      return {
        ...current,
        entry: {
          ...current.entry,
          [side]: {
            enabled: enabled ?? entrySide.enabled,
            trigger: { ...entrySide.trigger, rules: update(entrySide.trigger.rules) },
          },
        },
      };
    });
  }

  function removeIndicator(key: string) {
    setDraft((current) => {
      if (!current) return current;
      const indicators = { ...current.indicators };
      delete indicators[key];
      const dropRules = (rules: PresetTriggerRule[]) =>
        rules.filter((rule) => rule.indicator !== key && rule.ref !== key);
      return {
        ...current,
        indicators,
        entry: {
          long: {
            ...current.entry.long,
            trigger: {
              ...current.entry.long.trigger,
              rules: dropRules(current.entry.long.trigger.rules),
            },
          },
          short: {
            ...current.entry.short,
            trigger: {
              ...current.entry.short.trigger,
              rules: dropRules(current.entry.short.trigger.rules),
            },
          },
        },
      };
    });
  }

  function addIndicator(config: PresetIndicatorConfig) {
    setDraft((current) => {
      if (!current) return current;
      const key = suggestIndicatorKey(current.indicators, config);
      return { ...current, indicators: { ...current.indicators, [key]: config } };
    });
  }

  // -------------------------------------------------------------------------
  // Ações
  // -------------------------------------------------------------------------

  // Devolve o fingerprint do draft salvo (eco do servidor — jsonb reordena
  // chaves, então serializar o objeto local geraria um fingerprint diferente)
  async function handleSave(): Promise<string | null> {
    if (!draft) return null;
    setBusy("save");
    setStatusTone("info");
    setStatusMessage(t("builderSaving"));

    const result = await saveStrategy(token, draft);
    setBusy(null);

    if (result.status === "ok") {
      const savedFp = draftFingerprint(result.strategy.draft);
      setRecord(result.strategy);
      setDraft(result.strategy.draft);
      setSavedFingerprint(savedFp);
      setStatusTone("success");
      setStatusMessage(t("builderSavedMessage"));
      void reloadSession();
      return savedFp;
    }
    setStatusTone("danger");
    setStatusMessage(result.message);
    return null;
  }

  async function handleBacktest() {
    if (!draft) return;

    // Salva só quando há mudança: com a strategy ativa a API recusa o save
    // (strategy_running) e o backtest roda sobre o draft já salvo
    let previewFp = fingerprint;
    if (isDirty) {
      const savedFp = await handleSave();
      if (!savedFp) return;
      previewFp = savedFp;
    }

    setBusy("backtest");
    setStatusTone("info");
    setStatusMessage(t("builderBacktestRunning"));

    const endTime = Date.now();
    const result = await runBacktest(token, {
      startTime: endTime - periodDays * 24 * 60 * 60 * 1000,
      endTime,
      initialCapitalUsd,
      leverage: backtestLeverage,
      feePercent: 0.06,
      slippagePercent: 0.03,
    });

    setBusy(null);
    setPreview(result);
    setPreviewFingerprint(previewFp);

    if (result.status === "ok") {
      setStatusTone("success");
      setStatusMessage(null);
    } else {
      setStatusTone("danger");
      setStatusMessage(result.message);
    }
  }

  async function handleActivate() {
    if (isDirty || !record) {
      const saved = await handleSave();
      if (!saved) return;
    }

    setBusy("activate");
    setStatusTone("info");
    setStatusMessage(t("builderActivating"));

    const result = await activateStrategy(token);
    setBusy(null);

    if (result.status === "ok") {
      setRecord(result.strategy);
      showToast("success", t("builderActivatedMessage"));
      setStatusTone("success");
      setStatusMessage(t("builderActivatedMessage"));
      void reloadSession();
    } else {
      setStatusTone("danger");
      setStatusMessage(result.message);
    }
  }

  async function handlePauseBot() {
    if (busy !== null) return;
    setBusy("pause");
    setStatusTone("info");
    setStatusMessage(t("builderPausing"));

    const result = await pauseStrategy(token);
    setBusy(null);

    if (result.status === "ok") {
      setRecord(result.strategy);
      setStatusTone("success");
      setStatusMessage(t("builderPausedMessage"));
      void reloadSession();
    } else {
      setStatusTone("danger");
      setStatusMessage(result.message);
    }
  }

  function handleDiscard() {
    if (record) {
      setDraft(record.draft);
      setStatusTone(null);
      setStatusMessage(null);
    } else {
      setDraft(createDefaultDraft());
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (sessionStatus === "loading" || !draft) {
    return (
      <LoadingPanel
        message={t("runtimeStatusLoadingMessage")}
        title={t("builderTitleFallback")}
      />
    );
  }

  const successPreview = preview?.status === "ok" ? preview : null;

  return (
    <div className="builder-page">
      <div className="builder-head">
        <h1>{draft.name || t("builderTitleFallback")}</h1>
        <span className={`builder-chip ${isStrategyActive ? "builder-chip--active" : "builder-chip--paused"}`}>
          {isStrategyActive ? t("builderStatusActive") : t("builderStatusDraft")}
        </span>
        {statusMessage ? (
          <span className={`builder-status builder-status--${statusTone ?? "info"}`}>{statusMessage}</span>
        ) : null}
        <div className="builder-actions">
          <button className="builder-btn builder-btn--ghost" disabled={!isDirty || busy !== null} onClick={handleDiscard} type="button">
            {t("builderDiscard")}
          </button>
          <button className="builder-btn" disabled={busy !== null || isEditingBlocked} onClick={() => void handleSave()} type="button">
            {busy === "save" ? t("builderSaving") : t("builderSave")}
          </button>
          <button
            className="builder-btn builder-btn--primary"
            disabled={busy !== null || isEditingBlocked || !isDraftValid}
            onClick={() => void handleActivate()}
            type="button"
          >
            {busy === "activate" ? t("builderActivating") : t("builderActivate")}
          </button>
        </div>
      </div>

      {isEditingBlocked ? (
        <div className="builder-stale">
          <b>{t("builderEditingBlockedTag")}</b>
          {t("builderEditingBlocked")}
          <button
            className="builder-btn"
            disabled={busy !== null}
            onClick={() => void handlePauseBot()}
            style={{ marginLeft: "auto" }}
            type="button"
          >
            {busy === "pause" ? t("builderPausing") : t("dashPause")}
          </button>
        </div>
      ) : null}

      <div className="builder-grid">
        <div className="builder-col">
          <section className="builder-card">
            <h2>{t("builderSectionBasics")}</h2>
            <div className="builder-fields">
              <div className="builder-field">
                <label htmlFor="builder-symbol">{t("builderSymbolLabel")}</label>
                <select
                  disabled={isEditingBlocked}
                  id="builder-symbol"
                  onChange={(event) =>
                    patchDraft({ symbol: presetSymbolSchema.parse(event.target.value) })
                  }
                  value={draft.symbol}
                >
                  {presetSymbolSchema.options.map((symbol) => (
                    <option key={symbol} value={symbol}>{symbol}</option>
                  ))}
                </select>
              </div>
              <div className="builder-field">
                <label htmlFor="builder-timeframe">{t("builderTimeframeLabel")}</label>
                <select
                  disabled={isEditingBlocked}
                  id="builder-timeframe"
                  onChange={(event) =>
                    patchDraft({ timeframe: event.target.value as YourStrategyDraft["timeframe"] })
                  }
                  value={draft.timeframe}
                >
                  {TIMEFRAMES.map((timeframe) => (
                    <option key={timeframe} value={timeframe}>{timeframe}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <IndicatorsSection
            disabled={isEditingBlocked}
            draft={draft}
            onAdd={addIndicator}
            onRemove={removeIndicator}
            t={t}
          />

          <RulesSection
            disabled={isEditingBlocked}
            draft={draft}
            onPatchSide={patchSide}
            side="long"
            t={t}
          />
          <RulesSection
            disabled={isEditingBlocked}
            draft={draft}
            onPatchSide={patchSide}
            side="short"
            t={t}
          />

          <section className="builder-card">
            <h2>{t("builderSectionRisk")}</h2>
            <div className="builder-fields">
              <div className="builder-field">
                <label htmlFor="builder-sl-mode">{t("builderStopLossLabel")}</label>
                <select
                  disabled={isEditingBlocked}
                  id="builder-sl-mode"
                  onChange={(event) =>
                    patchDraft({
                      risk: {
                        ...draft.risk,
                        stopLoss:
                          event.target.value === "atr"
                            ? { mode: "atr", period: 14, multiplier: 1.5 }
                            : { mode: "static", unit: "percent", value: 3 },
                      },
                    })
                  }
                  value={draft.risk.stopLoss.mode}
                >
                  <option value="static">{t("builderStopLossStatic")}</option>
                  <option value="atr">{t("builderStopLossAtr")}</option>
                </select>
              </div>
              {draft.risk.stopLoss.mode === "static" ? (
                <div className="builder-field">
                  <label htmlFor="builder-sl-value">{t("builderStopLossValueLabel")}</label>
                  <input
                    disabled={isEditingBlocked}
                    id="builder-sl-value"
                    min={0.1}
                    onChange={(event) =>
                      patchDraft({
                        risk: {
                          ...draft.risk,
                          stopLoss: { mode: "static", unit: "percent", value: Number(event.target.value) },
                        },
                      })
                    }
                    step={0.1}
                    type="number"
                    value={draft.risk.stopLoss.value}
                  />
                </div>
              ) : (
                <>
                  <div className="builder-field">
                    <label htmlFor="builder-sl-period">{t("builderAtrPeriodLabel")}</label>
                    <input
                      disabled={isEditingBlocked}
                      id="builder-sl-period"
                      min={1}
                      onChange={(event) =>
                        patchDraft({
                          risk: {
                            ...draft.risk,
                            stopLoss: {
                              mode: "atr",
                              period: Number(event.target.value),
                              multiplier: draft.risk.stopLoss.mode === "atr" ? draft.risk.stopLoss.multiplier : 1.5,
                            },
                          },
                        })
                      }
                      type="number"
                      value={draft.risk.stopLoss.period}
                    />
                  </div>
                  <div className="builder-field">
                    <label htmlFor="builder-sl-mult">{t("builderAtrMultiplierLabel")}</label>
                    <input
                      disabled={isEditingBlocked}
                      id="builder-sl-mult"
                      min={0.1}
                      onChange={(event) =>
                        patchDraft({
                          risk: {
                            ...draft.risk,
                            stopLoss: {
                              mode: "atr",
                              period: draft.risk.stopLoss.mode === "atr" ? draft.risk.stopLoss.period : 14,
                              multiplier: Number(event.target.value),
                            },
                          },
                        })
                      }
                      step={0.1}
                      type="number"
                      value={draft.risk.stopLoss.multiplier}
                    />
                  </div>
                </>
              )}
              <div className="builder-field">
                <label htmlFor="builder-tp">{t("builderTakeProfitLabel")}</label>
                <input
                  disabled={isEditingBlocked}
                  id="builder-tp"
                  min={0.1}
                  onChange={(event) =>
                    patchDraft({
                      risk: { ...draft.risk, takeProfit: { mode: "rr", multiple: Number(event.target.value) } },
                    })
                  }
                  step={0.1}
                  type="number"
                  value={draft.risk.takeProfit?.multiple ?? 2}
                />
              </div>
            </div>
          </section>

          <section className="builder-card">
            <h2>{t("builderSectionExecution")}</h2>
            <div className="builder-fields">
              <div className="builder-field">
                <label htmlFor="builder-size">{t("builderPositionSizeLabel")}</label>
                <input
                  disabled={isEditingBlocked}
                  id="builder-size"
                  max={100}
                  min={0.5}
                  onChange={(event) => patchDraft({ positionSizeValue: Number(event.target.value) })}
                  step={0.5}
                  type="number"
                  value={draft.positionSizeValue}
                />
              </div>
            </div>
          </section>

          <section className="builder-card">
            <h2>{t("builderSectionChecklist")}</h2>
            <div className="builder-checklist">
              <div className={`item ${hasEnabledRules ? "" : "item--pending"}`}>
                {t("builderChecklistRules")}
              </div>
              <div className={`item ${hasRisk ? "" : "item--pending"}`}>
                {t("builderChecklistRisk")}
              </div>
              <div className={`item ${isDraftValid ? "" : "item--pending"}`}>
                {t("builderChecklistValid")}
              </div>
              <div className={`item ${successPreview && !isPreviewStale ? "" : "item--pending"}`}>
                {t("builderChecklistBacktest")}
              </div>
              {validationIssues.map((issue, index) => (
                <div className="item item--pending" key={`${issue.path}-${index}`}>
                  {issue.path}: {issue.message}
                </div>
              ))}
              {record?.activationBlockers.map((blocker) => (
                <div className="item item--pending" key={blocker}>{blocker}</div>
              ))}
            </div>
          </section>
        </div>

        <aside className="builder-backtest">
          <section className="builder-card">
            <div className="builder-bt-head">
              <h2>{t("builderBacktestTitle")}</h2>
              <select
                className="builder-field-select"
                onChange={(event) => setPeriodDays(Number(event.target.value))}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  background: "var(--bg-elevated)",
                  color: "var(--text-soft)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "5px 10px",
                }}
                value={periodDays}
              >
                {BACKTEST_PERIODS.map((period) => (
                  <option key={period.days} value={period.days}>{t(period.labelKey)}</option>
                ))}
              </select>
              <button
                className="builder-btn builder-btn--primary"
                disabled={busy !== null}
                onClick={() => void handleBacktest()}
                type="button"
              >
                {busy === "backtest" ? t("builderBacktestRunning") : t("builderBacktestRun")}
              </button>
            </div>

            {isPreviewStale ? (
              <div className="builder-stale">
                <b>{t("builderBacktestStaleTag")}</b>
                {t("builderBacktestStale")}
              </div>
            ) : null}

            {successPreview ? (
              <BacktestResult preview={successPreview} t={t} />
            ) : (
              <p style={{ color: "var(--text-soft)", fontSize: 13, margin: 0 }}>
                {t("builderBacktestEmpty")}
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Seção: indicadores
// ---------------------------------------------------------------------------

type Translate = ReturnType<typeof useI18n>["t"];

function IndicatorsSection(props: {
  disabled: boolean;
  draft: YourStrategyDraft;
  onAdd: (config: PresetIndicatorConfig) => void;
  onRemove: (key: string) => void;
  t: Translate;
}) {
  const { disabled, draft, onAdd, onRemove, t } = props;
  const [newType, setNewType] = useState<IndicatorTypeOption>("ema");
  const [newPeriod, setNewPeriod] = useState(14);
  const [newBand, setNewBand] = useState<"upper" | "lower" | "middle">("upper");

  function buildConfig(): PresetIndicatorConfig {
    switch (newType) {
      case "ema":
        return { type: "ema", period: newPeriod };
      case "sma":
        return { type: "sma", period: newPeriod, source: "close" };
      case "rsi":
        return { type: "rsi", period: newPeriod };
      case "atr":
        return { type: "atr", period: newPeriod };
      case "volume":
        return { type: "volume" };
      case "donchian":
        return { type: "donchian", period: newPeriod, band: newBand };
      case "adx":
        return { type: "adx", period: newPeriod };
    }
  }

  return (
    <section className="builder-card">
      <h2>{t("builderSectionIndicators")}</h2>
      <div className="builder-ind-row">
        {Object.entries(draft.indicators).map(([key, config]) => (
          <span className="builder-ind" key={key}>
            <b>{key}</b> {describeIndicator(config)}
            <button
              aria-label={`remove ${key}`}
              disabled={disabled}
              onClick={() => onRemove(key)}
              type="button"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="builder-add-inline">
        <div className="builder-field">
          <label htmlFor="builder-ind-type">{t("builderIndicatorTypeLabel")}</label>
          <select
            disabled={disabled}
            id="builder-ind-type"
            onChange={(event) => setNewType(event.target.value as IndicatorTypeOption)}
            value={newType}
          >
            {INDICATOR_TYPES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
        {newType !== "volume" ? (
          <div className="builder-field">
            <label htmlFor="builder-ind-period">{t("builderIndicatorPeriodLabel")}</label>
            <input
              disabled={disabled}
              id="builder-ind-period"
              min={1}
              onChange={(event) => setNewPeriod(Number(event.target.value))}
              style={{ width: 90 }}
              type="number"
              value={newPeriod}
            />
          </div>
        ) : null}
        {newType === "donchian" ? (
          <div className="builder-field">
            <label htmlFor="builder-ind-band">{t("builderIndicatorBandLabel")}</label>
            <select
              disabled={disabled}
              id="builder-ind-band"
              onChange={(event) => setNewBand(event.target.value as "upper" | "lower" | "middle")}
              value={newBand}
            >
              <option value="upper">upper</option>
              <option value="lower">lower</option>
              <option value="middle">middle</option>
            </select>
          </div>
        ) : null}
        <button
          className="builder-btn"
          disabled={disabled}
          onClick={() => onAdd(buildConfig())}
          type="button"
        >
          {t("builderAddIndicator")}
        </button>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Seção: regras de entrada
// ---------------------------------------------------------------------------

function RulesSection(props: {
  disabled: boolean;
  draft: YourStrategyDraft;
  onPatchSide: (
    side: "long" | "short",
    update: (rules: PresetTriggerRule[]) => PresetTriggerRule[],
    enabled?: boolean,
  ) => void;
  side: "long" | "short";
  t: Translate;
}) {
  const { disabled, draft, onPatchSide, side, t } = props;
  const entrySide = draft.entry[side];
  const indicatorKeys = Object.keys(draft.indicators);

  function updateRule(index: number, next: PresetTriggerRule) {
    onPatchSide(side, (rules) => rules.map((rule, i) => (i === index ? next : rule)));
  }

  function removeRule(index: number) {
    onPatchSide(side, (rules) => rules.filter((_, i) => i !== index));
  }

  function addRule() {
    const firstKey = indicatorKeys[0];
    if (!firstKey) return;
    onPatchSide(side, (rules) => [
      ...rules,
      { scope: "currentCandle", type: "threshold", indicator: firstKey, operator: "above", value: 50 },
    ]);
  }

  function setOperator(rule: PresetTriggerRule, index: number, operator: string) {
    if ((CROSS_OPERATORS as readonly string[]).includes(operator)) {
      updateRule(index, {
        scope: rule.scope,
        type: "cross",
        indicator: rule.indicator,
        operator: operator as (typeof CROSS_OPERATORS)[number],
        ...(rule.ref !== undefined ? { ref: rule.ref } : { value: rule.value ?? 0 }),
      } as PresetTriggerRule);
    } else {
      updateRule(index, {
        scope: rule.scope,
        type: "threshold",
        indicator: rule.indicator,
        operator: operator as (typeof THRESHOLD_OPERATORS)[number],
        ...(rule.ref !== undefined ? { ref: rule.ref } : { value: rule.value ?? 0 }),
      } as PresetTriggerRule);
    }
  }

  function setTarget(rule: PresetTriggerRule, index: number, target: string) {
    const base = { scope: rule.scope, type: rule.type, indicator: rule.indicator, operator: rule.operator };
    if (target === "__number__") {
      updateRule(index, { ...base, value: rule.value ?? 0 } as PresetTriggerRule);
    } else {
      updateRule(index, { ...base, ref: target } as PresetTriggerRule);
    }
  }

  return (
    <section className="builder-card">
      <h2>
        <span className={`builder-side-tag builder-side-tag--${side}`}>{side.toUpperCase()}</span>
        {entrySide.enabled ? t("builderEntryLongTitle") : t("builderSideDisabled")}
        <button
          className="builder-btn builder-btn--ghost"
          disabled={disabled}
          onClick={() => onPatchSide(side, (rules) => rules, !entrySide.enabled)}
          style={{ marginLeft: "auto", padding: "3px 10px", fontSize: 10 }}
          type="button"
        >
          {entrySide.enabled ? t("builderDisableSide") : t("builderEnableSide")}
        </button>
      </h2>
      {entrySide.enabled ? (
        <>
          {entrySide.trigger.rules.map((rule, index) => (
            <div key={index}>
              {index > 0 ? <div className="builder-rule-join">{t("builderRuleJoin")}</div> : null}
              <div className="builder-rule">
                <select
                  disabled={disabled}
                  onChange={(event) => updateRule(index, { ...rule, indicator: event.target.value } as PresetTriggerRule)}
                  value={rule.indicator}
                >
                  {indicatorKeys.map((key) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
                <select
                  disabled={disabled}
                  onChange={(event) => setOperator(rule, index, event.target.value)}
                  value={rule.operator}
                >
                  {[...THRESHOLD_OPERATORS, ...CROSS_OPERATORS].map((operator) => (
                    <option key={operator} value={operator}>{OPERATOR_LABELS[operator]}</option>
                  ))}
                </select>
                <select
                  disabled={disabled}
                  onChange={(event) => setTarget(rule, index, event.target.value)}
                  value={rule.ref ?? "__number__"}
                >
                  <option value="__number__">{t("builderRuleTargetNumber")}</option>
                  <option value="PRICE">PRICE</option>
                  {indicatorKeys
                    .filter((key) => key !== rule.indicator)
                    .map((key) => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                </select>
                {rule.ref === undefined ? (
                  <input
                    disabled={disabled}
                    onChange={(event) =>
                      updateRule(index, { ...rule, value: Number(event.target.value) } as PresetTriggerRule)
                    }
                    step="any"
                    type="number"
                    value={rule.value ?? 0}
                  />
                ) : null}
                <select
                  disabled={disabled}
                  onChange={(event) =>
                    updateRule(index, { ...rule, scope: event.target.value as PresetTriggerRule["scope"] } as PresetTriggerRule)
                  }
                  value={rule.scope}
                >
                  <option value="currentCandle">{t("builderRuleScopeCurrent")}</option>
                  <option value="previousCandle">{t("builderRuleScopePrevious")}</option>
                </select>
                <button
                  aria-label="remove rule"
                  className="builder-rule-del"
                  disabled={disabled}
                  onClick={() => removeRule(index)}
                  type="button"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button className="builder-add-rule" disabled={disabled} onClick={addRule} type="button">
            {t("builderAddRule")}
          </button>
        </>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Backtest: métricas + curva de equity
// ---------------------------------------------------------------------------

type SuccessPreview = Extract<BacktestResponse, { status: "ok" }>;

function BacktestResult(props: { preview: SuccessPreview; t: Translate }) {
  const { preview, t } = props;
  const summary = preview.summary;
  const pct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

  return (
    <>
      <div className="builder-legend">
        <span className="li"><span className="sw" style={{ background: "var(--chart-strategy)" }} />{t("builderLegendStrategy")}</span>
        <span className="li"><span className="sw" style={{ background: "var(--chart-hold)" }} />{t("builderLegendHold")}</span>
      </div>
      <EquityChart equityCurve={preview.equityCurve} holdCurve={preview.holdCurve} />
      <div className="builder-metrics">
        <div className="builder-metric">
          <div className="k">{t("builderMetricReturn")}</div>
          <div className={`v ${summary.strategyReturnPercent >= 0 ? "v--up" : "v--down"}`}>
            {pct(summary.strategyReturnPercent)}
          </div>
          <div className="sub">{t("builderMetricVsHold")} {pct(summary.holdReturnPercent)}</div>
        </div>
        <div className="builder-metric">
          <div className="k">{t("builderMetricAlpha")}</div>
          <div className={`v ${summary.alphaVsHoldPercent >= 0 ? "v--up" : "v--down"}`}>
            {pct(summary.alphaVsHoldPercent)}
          </div>
        </div>
        <div className="builder-metric">
          <div className="k">{t("builderMetricMaxDrawdown")}</div>
          <div className="v v--down">−{summary.maxDrawdownPercent.toFixed(1)}%</div>
        </div>
        <div className="builder-metric">
          <div className="k">{t("builderMetricWinRate")}</div>
          <div className="v">{summary.winRatePercent.toFixed(0)}%</div>
          <div className="sub">{summary.totalTrades} {t("builderMetricTrades")}</div>
        </div>
        <div className="builder-metric">
          <div className="k">{t("builderMetricProfitFactor")}</div>
          <div className="v">{summary.profitFactor.toFixed(2)}</div>
        </div>
        <div className="builder-metric">
          <div className="k">{t("builderMetricCandles")}</div>
          <div className="v">{preview.candlesUsed.toLocaleString("en-US")}</div>
        </div>
      </div>
      <details className="builder-data" style={{ marginTop: 12, fontSize: 12, color: "var(--text-soft)" }}>
        <summary style={{ cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {t("builderDataTableToggle")}
        </summary>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }} className="num">
          <tbody>
            <tr><td>Initial capital</td><td style={{ textAlign: "right" }}>${summary.initialCapitalUsd.toLocaleString("en-US")}</td></tr>
            <tr><td>Ending equity</td><td style={{ textAlign: "right" }}>${summary.endingEquityUsd.toLocaleString("en-US")}</td></tr>
            <tr><td>Ending hold equity</td><td style={{ textAlign: "right" }}>${summary.endingHoldEquityUsd.toLocaleString("en-US")}</td></tr>
            <tr><td>Wins / losses</td><td style={{ textAlign: "right" }}>{summary.wins} / {summary.losses}</td></tr>
          </tbody>
        </table>
      </details>
    </>
  );
}

function EquityChart(props: {
  equityCurve: { time: string; equity: number }[];
  holdCurve: { time: string; equity: number }[];
}) {
  const { equityCurve, holdCurve } = props;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const W = 380;
  const H = 170;
  const PAD = { l: 44, r: 10, t: 8, b: 8 };

  const points = equityCurve.length;
  if (points < 2) {
    return null;
  }

  const all = [...equityCurve, ...holdCurve].map((p) => p.equity);
  const lo = Math.min(...all) * 0.998;
  const hi = Math.max(...all) * 1.002;
  const x = (i: number, n: number) => PAD.l + (i / Math.max(1, n - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - lo) / Math.max(1e-9, hi - lo)) * (H - PAD.t - PAD.b);
  const toPath = (curve: { equity: number }[]) =>
    curve.map((p, i) => `${i ? "L" : "M"}${x(i, curve.length).toFixed(1)},${y(p.equity).toFixed(1)}`).join("");

  const gridYs = [0.25, 0.5, 0.75].map((f) => ({
    gy: PAD.t + f * (H - PAD.t - PAD.b),
    value: hi - f * (hi - lo),
  }));

  const last = equityCurve[equityCurve.length - 1]!;
  const lastHold = holdCurve[holdCurve.length - 1];
  const hover = hoverIndex !== null ? equityCurve[hoverIndex] : null;
  const hoverHold = hoverIndex !== null ? holdCurve[Math.min(hoverIndex, holdCurve.length - 1)] : null;

  const fmt = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;

  return (
    <div className="builder-chart-wrap">
      <svg
        aria-label={`Equity: strategy ends at ${fmt(last.equity)}${lastHold ? `, hold at ${fmt(lastHold.equity)}` : ""}`}
        onMouseLeave={() => setHoverIndex(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const px = ((event.clientX - rect.left) / rect.width) * W;
          const index = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (points - 1));
          setHoverIndex(Math.max(0, Math.min(points - 1, index)));
        }}
        role="img"
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
      >
        {gridYs.map((g) => (
          <g key={g.gy}>
            <line stroke="var(--border)" strokeWidth={1} x1={PAD.l} x2={W - PAD.r} y1={g.gy} y2={g.gy} />
            <text textAnchor="end" x={PAD.l - 6} y={g.gy + 3}>{`${(g.value / 1000).toFixed(1)}k`}</text>
          </g>
        ))}
        <path d={toPath(holdCurve)} fill="none" stroke="var(--chart-hold)" strokeLinejoin="round" strokeWidth={2} />
        <path d={toPath(equityCurve)} fill="none" stroke="var(--chart-strategy)" strokeLinejoin="round" strokeWidth={2} />
        <circle cx={x(points - 1, points)} cy={y(last.equity)} fill="var(--chart-strategy)" r={3.5} />
        {hoverIndex !== null ? (
          <line
            stroke="var(--text-faint)"
            strokeDasharray="3 3"
            strokeWidth={1}
            x1={x(hoverIndex, points)}
            x2={x(hoverIndex, points)}
            y1={PAD.t}
            y2={H - PAD.b}
          />
        ) : null}
      </svg>
      {hover ? (
        <div
          className="num"
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "4px 10px",
            fontSize: 11,
          }}
        >
          <span style={{ color: "var(--chart-strategy)" }}>{fmt(hover.equity)}</span>
          {hoverHold ? <span style={{ color: "var(--chart-hold)" }}> · {fmt(hoverHold.equity)}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
