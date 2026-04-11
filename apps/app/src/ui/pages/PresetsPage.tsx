import {
  YOUR_STRATEGY_PRESET_DEFINITION_ID,
  activateYourStrategyRequestSchema,
  presetActivationRequestSchema,
  type OperationalPresetsSessionFound,
  type MarketInfoItem,
  type PresetBacktestCurvePoint,
  type PresetBacktestPreviewResponse,
  type PresetBacktestPreviewSuccess,
  type PresetEditableConfig,
  type PresetIndicatorConfig,
  type PresetTriggerRule,
  type YourStrategy,
  type YourStrategyBacktestPreviewResponse,
  type YourStrategyBacktestPreviewSuccess,
  type YourStrategyDraft,
} from "@pacifica/contracts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyOperationalPresetsSessionSnapshot } from "../../features/account/apply-operational-page-sessions";
import { readOperationalPresetsViaBackend } from "../../features/account/backend-operational-page-sessions";
import { useOperationalPageSession } from "../../features/account/use-operational-page-session";
import { activatePreset } from "../../features/presets/preset-activation";
import { previewPresetBacktestViaBackend } from "../../features/presets/backend-backtest-preview";
import {
  allowedPresetSymbols,
  getEditableConfigForPreset,
  getPresetCatalog,
  getPresetCatalogItemByDefinitionId,
} from "../../features/presets/preset-catalog";
import {
  activateYourStrategyViaBackend,
  previewYourStrategyBacktestViaBackend,
  saveYourStrategyViaBackend,
} from "../../features/presets/your-strategy-backend";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";

export function PresetsPage() {
  const { t } = useI18n();
  const {
    canAccessProduct,
    setBuilderApprovalState,
    setCredentialState,
    setOperationalState,
    setPresetState,
    setRuntimeState,
    state,
  } = useAppState();
  const presets = getPresetCatalog(t);
  const currentPresetsRef = useRef(state.presets);
  const selectedPresetDefinitionId = state.presets.selectedPresetDefinitionId;
  const isYourStrategySelected =
    selectedPresetDefinitionId === YOUR_STRATEGY_PRESET_DEFINITION_ID;
  const [isYourStrategyModalOpen, setIsYourStrategyModalOpen] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isBacktestLoading, setIsBacktestLoading] = useState(false);
  const [backtestPreview, setBacktestPreview] =
    useState<PresetBacktestPreviewResponse | null>(null);
  const [yourStrategyRecord, setYourStrategyRecord] = useState<YourStrategy | null>(null);
  const [, setYourStrategyEditorValue] = useState("");
  const [yourStrategyDraft, setYourStrategyDraft] = useState<YourStrategyDraft | null>(
    null,
  );
  const [yourStrategyValidationMessage, setYourStrategyValidationMessage] =
    useState<string | null>(null);
  const [yourStrategyPreview, setYourStrategyPreview] =
    useState<YourStrategyBacktestPreviewResponse | null>(null);
  const [yourStrategyStatusTone, setYourStrategyStatusTone] = useState<
    "neutral" | "info" | "success" | "danger"
  >("neutral");
  const [yourStrategyStatusMessage, setYourStrategyStatusMessage] =
    useState<string | null>(null);
  const [yourStrategyStep, setYourStrategyStep] = useState(1);
  const [marketInfo, setMarketInfo] = useState<MarketInfoItem[]>([]);
  const [loadedYourStrategy, setLoadedYourStrategy] = useState<YourStrategy | null>(
    null,
  );
  const [hasLoadedYourStrategy, setHasLoadedYourStrategy] = useState(false);
  const applyPresetsSnapshot = useCallback(
    (snapshot: OperationalPresetsSessionFound) => {
      setMarketInfo(snapshot.marketInfo);
      setLoadedYourStrategy(snapshot.yourStrategy);
      setHasLoadedYourStrategy(true);
      applyOperationalPresetsSessionSnapshot(snapshot, {
        setBuilderApprovalState,
        setCredentialState,
        setOperationalState,
        setPresetState,
        setRuntimeState,
        currentPresets: currentPresetsRef.current,
      });
    },
    [
      setBuilderApprovalState,
      setCredentialState,
      setOperationalState,
      setPresetState,
      setRuntimeState,
    ],
  );
  const presetsSession = useOperationalPageSession({
    readSnapshot: readOperationalPresetsViaBackend,
    applySnapshot: applyPresetsSnapshot,
    requestKey: "presets",
    loadingMessage: t("runtimeStatusLoading"),
    unavailableMessage: t("runtimeStatusError"),
  });
  const selectedPreset = useMemo(
    () => getPresetCatalogItemByDefinitionId(selectedPresetDefinitionId, t),
    [selectedPresetDefinitionId, t],
  );

  useEffect(() => {
    currentPresetsRef.current = state.presets;
  }, [state.presets]);

  const draftConfig = useMemo(() => {
    if (!selectedPresetDefinitionId || isYourStrategySelected) {
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
    isYourStrategySelected,
    selectedPresetDefinitionId,
  ]);

  const activationSummary = isYourStrategySelected
    ? yourStrategyDraft
      ? t("yourStrategyActivationSummary")
          .replace("{symbol}", yourStrategyDraft.symbol)
          .replace("{size}", `${yourStrategyDraft.positionSizeValue}%`)
          .replace(
            "{longState}",
            yourStrategyDraft.entry.long.enabled
              ? t("presetLongEnabled")
              : t("presetLongDisabled"),
          )
          .replace(
            "{shortState}",
            yourStrategyDraft.entry.short.enabled
              ? t("presetShortEnabled")
              : t("presetShortDisabled"),
          )
      : t("presetActivationSummaryEmpty")
    : selectedPreset && draftConfig
      ? selectedPreset.activationSummary(draftConfig)
      : t("presetActivationSummaryEmpty");

  const selectedSymbol = isYourStrategySelected
    ? yourStrategyDraft?.symbol
    : draftConfig?.symbol;

  const selectedMarketInfo = useMemo(
    () => marketInfo.find((item) => item.symbol === selectedSymbol?.split("/")[0]),
    [marketInfo, selectedSymbol],
  );
  const selectedSymbolConfig = useMemo(
    () =>
      state.runtime.symbolOperationalConfigs.find(
        (config) => config.symbol === selectedSymbol,
      ) ?? null,
    [selectedSymbol, state.runtime.symbolOperationalConfigs],
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
  const activeBacktestPreview = isYourStrategySelected
    ? yourStrategyPreview
    : backtestPreview;
  const isYourStrategyEditingBlocked =
    state.runtime.botStatus === "active" || state.runtime.botStatus === "syncing";

  useEffect(() => {
    if (!isYourStrategySelected || !state.wallet.mainWalletPublicKey) {
      return;
    }

    if (!hasLoadedYourStrategy) {
      setYourStrategyStatusTone("info");
      setYourStrategyStatusMessage(t("yourStrategyStatusLoading"));
      return;
    }

    if (loadedYourStrategy) {
      hydrateYourStrategyEditor(loadedYourStrategy);
      setYourStrategyStatusTone("success");
      setYourStrategyStatusMessage(t("yourStrategyLoadedMessage"));
      return;
    }

    const starterDraft = createDefaultYourStrategyDraft();
    setYourStrategyRecord(null);
    setYourStrategyDraft(starterDraft);
    setYourStrategyEditorValue(JSON.stringify(starterDraft, null, 2));
    setYourStrategyValidationMessage(null);
    setYourStrategyPreview(null);
    setYourStrategyStatusTone("neutral");
    setYourStrategyStatusMessage(t("yourStrategyStatusNoSavedDraft"));
  }, [
    hasLoadedYourStrategy,
    isYourStrategySelected,
    loadedYourStrategy,
    state.wallet.mainWalletPublicKey,
    t,
  ]);

  useEffect(() => {
    let isCancelled = false;

    if (isYourStrategySelected || !selectedPreset || !draftConfig) {
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
  }, [
    backtestRequestKey,
    draftConfig,
    initialCapitalUsd,
    isYourStrategySelected,
    selectedLeverage,
    selectedPreset,
  ]);

  function handleSelectPreset(presetDefinitionId: string) {
    if (presetDefinitionId === YOUR_STRATEGY_PRESET_DEFINITION_ID) {
      setYourStrategyStep(1);
      setIsYourStrategyModalOpen(true);
      setPresetState({
        selectedPresetDefinitionId: presetDefinitionId,
        draftEditableConfig: null,
        activationStatus: "idle",
        activationMessage: null,
      });
      return;
    }

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

  function hydrateYourStrategyEditor(strategy: YourStrategy) {
    const normalizedDraft = normalizeYourStrategyDraftForBuilder(strategy.draft);
    setYourStrategyRecord(strategy);
    setYourStrategyDraft(normalizedDraft);
    setYourStrategyEditorValue(JSON.stringify(normalizedDraft, null, 2));
    setYourStrategyValidationMessage(null);
  }

  function handleResetYourStrategyDraft() {
    const starterDraft = normalizeYourStrategyDraftForBuilder(
      createDefaultYourStrategyDraft(),
    );
    setYourStrategyRecord(null);
    setYourStrategyPreview(null);
    setYourStrategyDraft(starterDraft);
    setYourStrategyEditorValue(JSON.stringify(starterDraft, null, 2));
    setYourStrategyValidationMessage(null);
    setYourStrategyStatusTone("neutral");
    setYourStrategyStatusMessage(t("yourStrategyStatusNoSavedDraft"));
    setPresetState({
      activationStatus: "idle",
      activationMessage: null,
    });
  }

  async function handleReloadYourStrategy(options?: { preservePreview?: boolean }) {
    if (!state.wallet.mainWalletPublicKey) {
      return;
    }

    setYourStrategyStatusTone("info");
    setYourStrategyStatusMessage(t("yourStrategyStatusLoading"));

    const result = await presetsSession.reload();

    if (result?.status === "found") {
      if (!options?.preservePreview) {
        setYourStrategyPreview(null);
      }
      if (result.yourStrategy) {
        hydrateYourStrategyEditor(result.yourStrategy);
        setYourStrategyStatusTone("success");
        setYourStrategyStatusMessage(t("yourStrategyLoadedMessage"));
      } else {
        handleResetYourStrategyDraft();
      }
      return;
    }

    setYourStrategyStatusTone("danger");
    setYourStrategyStatusMessage(
      result?.status === "error"
        ? result.message
        : t("runtimeStatusError"),
    );
  }

  async function handleSaveYourStrategy() {
    if (!state.wallet.mainWalletPublicKey || !yourStrategyDraft) {
      setYourStrategyStatusTone("danger");
      setYourStrategyStatusMessage(
        yourStrategyValidationMessage ?? t("yourStrategyEditorErrorFallback"),
      );
      return false;
    }

    setYourStrategyStatusTone("info");
    setYourStrategyStatusMessage(t("yourStrategyStatusLoading"));

    const result = await saveYourStrategyViaBackend({
      walletAddress: state.wallet.mainWalletPublicKey,
      draft: yourStrategyDraft,
    });

    if (result.status === "success") {
      hydrateYourStrategyEditor(result.strategy);
      setYourStrategyStatusTone("success");
      setYourStrategyStatusMessage(result.message);
      return true;
    }

    setYourStrategyStatusTone("danger");
    setYourStrategyStatusMessage(result.message);
    return false;
  }

  async function handlePreviewYourStrategy() {
    if (!state.wallet.mainWalletPublicKey) {
      return;
    }

    const saved = await handleSaveYourStrategy();

    if (!saved) {
      return;
    }

    const period = getPresetBacktestPeriod();

    setIsBacktestLoading(true);
    setYourStrategyStep(getYourStrategyWizardSteps(t, yourStrategyDraft).length);
    setYourStrategyStatusTone("info");
    setYourStrategyStatusMessage(t("presetBacktestLoadingDescription"));

    const result = await previewYourStrategyBacktestViaBackend({
      walletAddress: state.wallet.mainWalletPublicKey,
      priceSource: "market",
      startTime: period.startTime,
      endTime: period.endTime,
      initialCapitalUsd,
      leverage: selectedLeverage ?? 1,
      feePercent: 0.06,
      slippagePercent: 0.03,
    });

    setYourStrategyPreview(result);
    setIsBacktestLoading(false);

    if (result.status === "success") {
      setYourStrategyStatusTone("success");
      setYourStrategyStatusMessage(t("yourStrategyPreviewHint"));
      void handleReloadYourStrategy({ preservePreview: true });
      return;
    }

    setYourStrategyStatusTone("danger");
    setYourStrategyStatusMessage(result.message);
  }

  function updateYourStrategyDraft(
    updater: (currentDraft: YourStrategyDraft) => YourStrategyDraft,
  ) {
    setYourStrategyDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      const nextDraft = normalizeYourStrategyDraftForBuilder(updater(currentDraft));
      setYourStrategyEditorValue(JSON.stringify(nextDraft, null, 2));
      setYourStrategyValidationMessage(null);
      setYourStrategyPreview(null);
      setPresetState({
        activationStatus: "idle",
        activationMessage: null,
      });

      return nextDraft;
    });
  }

  function handleUpdateYourStrategyField<
    K extends keyof Pick<YourStrategyDraft, "name" | "symbol" | "timeframe" | "positionSizeValue">
  >(field: K, value: YourStrategyDraft[K]) {
    updateYourStrategyDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  function handleToggleYourStrategySide(side: "long" | "short") {
    updateYourStrategyDraft((currentDraft) => ({
      ...currentDraft,
      entry: {
        ...currentDraft.entry,
        [side]: {
          ...currentDraft.entry[side],
          enabled: !currentDraft.entry[side].enabled,
        },
      },
    }));
  }

  function handleUpdateYourStrategyGroupType(
    side: "long" | "short",
    type: "all" | "any",
  ) {
    updateYourStrategyDraft((currentDraft) => ({
      ...currentDraft,
      entry: {
        ...currentDraft.entry,
        [side]: {
          ...currentDraft.entry[side],
          trigger: {
            ...currentDraft.entry[side].trigger,
            type,
          },
        },
      },
    }));
  }

  function handleUpdateYourStrategyRule(
    side: "long" | "short",
    ruleIndex: number,
    updater: (rule: PresetTriggerRule) => PresetTriggerRule,
  ) {
    updateYourStrategyDraft((currentDraft) => ({
      ...currentDraft,
      entry: {
        ...currentDraft.entry,
        [side]: {
          ...currentDraft.entry[side],
          trigger: {
            ...currentDraft.entry[side].trigger,
            rules: currentDraft.entry[side].trigger.rules.map((rule, index) =>
              index === ruleIndex ? updater(rule) : rule,
            ),
          },
        },
      },
    }));
  }

  function handleAddYourStrategyRule(side: "long" | "short") {
    const firstIndicatorKey = yourStrategyDraft
      ? Object.keys(yourStrategyDraft.indicators)[0] ?? "EMA1"
      : "EMA1";

    updateYourStrategyDraft((currentDraft) => ({
      ...currentDraft,
      entry: {
        ...currentDraft.entry,
        [side]: {
          ...currentDraft.entry[side],
          trigger: {
            ...currentDraft.entry[side].trigger,
            rules: [
              ...currentDraft.entry[side].trigger.rules,
              createDefaultRuleForIndicator(
                currentDraft.indicators,
                firstIndicatorKey,
              ),
            ],
          },
        },
      },
    }));
  }

  function handleRemoveYourStrategyRule(side: "long" | "short", ruleIndex: number) {
    updateYourStrategyDraft((currentDraft) => {
      const nextRules = currentDraft.entry[side].trigger.rules.filter(
        (_, index) => index !== ruleIndex,
      );

      return {
        ...currentDraft,
        entry: {
          ...currentDraft.entry,
          [side]: {
            ...currentDraft.entry[side],
            trigger: {
              ...currentDraft.entry[side].trigger,
              rules:
                nextRules.length > 0
                  ? nextRules
                  : [createDefaultThresholdRule(getFirstIndicatorKey(currentDraft))],
            },
          },
        },
      };
    });
  }

  function handleAddIndicator() {
    updateYourStrategyDraft((currentDraft) => {
      const nextIndicator = { type: "ema", period: 20 } satisfies PresetIndicatorConfig;
      const nextKey = createIndicatorKeyForConfig(currentDraft, nextIndicator);

      return ensureVolumeSupportDraft({
        ...currentDraft,
        indicators: {
          ...currentDraft.indicators,
          [nextKey]: nextIndicator,
        },
      });
    });
  }

  function handleRenameIndicator(
    indicatorKey: string,
    nextIndicator: PresetIndicatorConfig,
  ) {
    updateYourStrategyDraft((currentDraft) => {
      const nextKey = createIndicatorKeyForConfig(currentDraft, nextIndicator, indicatorKey);
      const nextIndicators: Record<string, PresetIndicatorConfig> = {
        ...currentDraft.indicators,
      };
      delete nextIndicators[indicatorKey];
      nextIndicators[nextKey] = nextIndicator;

      return ensureVolumeSupportDraft({
        ...currentDraft,
        indicators: nextIndicators,
        entry: {
          long: renameEntrySideIndicatorReferences(
            currentDraft.entry.long,
            indicatorKey,
            nextKey,
          ),
          short: renameEntrySideIndicatorReferences(
            currentDraft.entry.short,
            indicatorKey,
            nextKey,
          ),
        },
      });
    });
  }

  function handleUpdateIndicator(
    indicatorKey: string,
    nextIndicator: PresetIndicatorConfig,
  ) {
    const currentIndicator = yourStrategyDraft?.indicators[indicatorKey] ?? null;

    if (currentIndicator && currentIndicator.type !== nextIndicator.type) {
      handleRenameIndicator(indicatorKey, nextIndicator);
      return;
    }

    updateYourStrategyDraft((currentDraft) =>
      ensureVolumeSupportDraft({
        ...currentDraft,
        indicators: {
          ...currentDraft.indicators,
          [indicatorKey]: nextIndicator,
        },
      }),
    );
  }

  function handleRemoveIndicator(indicatorKey: string) {
    updateYourStrategyDraft((currentDraft) => {
      const nextIndicators: Record<string, PresetIndicatorConfig> = {
        ...currentDraft.indicators,
      };
      delete nextIndicators[indicatorKey];

      if (currentDraft.indicators[indicatorKey]?.type === "volume") {
        Object.entries(nextIndicators).forEach(([candidateKey, candidateIndicator]) => {
          if (isVolumeDerivedIndicator(candidateIndicator)) {
            delete nextIndicators[candidateKey];
          }
        });
      }

      const fallbackKey =
        Object.keys(nextIndicators)[0] ??
        addIndicatorToRecord(nextIndicators, "EMA1", {
          type: "ema",
          period: 9,
        });

      return ensureVolumeSupportDraft({
        ...currentDraft,
        indicators: nextIndicators,
        entry: {
          long: sanitizeEntrySideIndicatorReferences(
            currentDraft.entry.long,
            indicatorKey,
            fallbackKey,
          ),
          short: sanitizeEntrySideIndicatorReferences(
            currentDraft.entry.short,
            indicatorKey,
            fallbackKey,
          ),
        },
      });
    });
  }

  function handleUpdateStopLossMode(mode: "static" | "atr") {
    updateYourStrategyDraft((currentDraft) => ({
      ...currentDraft,
      risk: {
        ...currentDraft.risk,
        stopLoss:
          mode === "static"
            ? { mode: "static", unit: "percent", value: 3 }
            : { mode: "atr", period: 14, multiplier: 1.5 },
      },
    }));
  }

  function handleUpdateStopLossStaticValue(value: number) {
    updateYourStrategyDraft((currentDraft) => ({
      ...currentDraft,
      risk: {
        ...currentDraft.risk,
        stopLoss:
          currentDraft.risk.stopLoss.mode === "static"
            ? { ...currentDraft.risk.stopLoss, value }
            : currentDraft.risk.stopLoss,
      },
    }));
  }

  function handleUpdateStopLossAtrPeriod(period: number) {
    updateYourStrategyDraft((currentDraft) => ({
      ...currentDraft,
      risk: {
        ...currentDraft.risk,
        stopLoss:
          currentDraft.risk.stopLoss.mode === "atr"
            ? { ...currentDraft.risk.stopLoss, period }
            : currentDraft.risk.stopLoss,
      },
    }));
  }

  function handleUpdateStopLossAtrMultiplier(multiplier: number) {
    updateYourStrategyDraft((currentDraft) => ({
      ...currentDraft,
      risk: {
        ...currentDraft.risk,
        stopLoss:
          currentDraft.risk.stopLoss.mode === "atr"
            ? { ...currentDraft.risk.stopLoss, multiplier }
            : currentDraft.risk.stopLoss,
      },
    }));
  }

  function handleUpdateTakeProfitEnabled(enabled: boolean) {
    updateYourStrategyDraft((currentDraft) => ({
      ...currentDraft,
      risk: {
        ...currentDraft.risk,
        takeProfit: enabled ? { mode: "rr", multiple: 2 } : null,
      },
    }));
  }

  function handleUpdateTakeProfitMultiple(multiple: number) {
    updateYourStrategyDraft((currentDraft) => ({
      ...currentDraft,
      risk: {
        ...currentDraft.risk,
        takeProfit: currentDraft.risk.takeProfit
          ? { mode: "rr", multiple }
          : { mode: "rr", multiple },
      },
    }));
  }

  function updateDraftConfig<K extends keyof Pick<
    PresetEditableConfig,
    "symbol" | "positionSizeValue" | "longEnabled" | "shortEnabled"
  >>(
    field: K,
    value: PresetEditableConfig[K],
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
    if (isYourStrategySelected) {
      if (!state.wallet.mainWalletPublicKey) {
        setPresetState({
          activationStatus: "error",
          activationMessage: t("presetActivationErrorNoSelection"),
        });
        return;
      }

      setPresetState({
        activationStatus: "loading",
        activationMessage: t("presetActivationLoading"),
      });
      setRuntimeState({
        screenStatus: "loading",
        lastRuntimeMessage: t("runtimeStatusLoading"),
      });

      const request = activateYourStrategyRequestSchema.parse({
        walletAddress: state.wallet.mainWalletPublicKey,
      });
      const result = await activateYourStrategyViaBackend(request);

      if (result.status === "success") {
        setPresetState({
          activePreset: result.activation,
          selectedPresetDefinitionId: YOUR_STRATEGY_PRESET_DEFINITION_ID,
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
      } else {
        setPresetState({
          activationStatus: "error",
          activationMessage: result.message,
        });
        setRuntimeState({
          screenStatus: "error",
          lastRuntimeMessage: result.message,
        });
      }

      return;
    }

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
    setYourStrategyStep(1);
    setIsYourStrategyModalOpen(false);
    setPresetState({
      selectedPresetDefinitionId: null,
      draftEditableConfig: null,
      activationStatus: "idle",
      activationMessage: null,
    });
  }

  function handleActivationRequest() {
    if (isYourStrategySelected) {
      if (!yourStrategyDraft) {
        void handleActivatePreset();
        return;
      }

      void handleActivatePreset();
      return;
    }

    if (!isYourStrategySelected && (!selectedPreset || !draftConfig)) {
      void handleActivatePreset();
      return;
    }

    setIsActivationModalOpen(true);
  }

  return (
    <div className="page-stack">
      {presetsSession.status === "loading" || presetsSession.status === "error" ? (
        <section
          className={`page-card status-banner status-banner--${
            presetsSession.status === "error" ? "danger" : "warning"
          }`}
        >
          <strong>
            {presetsSession.status === "error"
              ? t("runtimeStatusError")
              : t("runtimeStatusLoading")}
          </strong>
          <p>{presetsSession.message}</p>
        </section>
      ) : null}

      <ConfirmationModal
        cancelLabel={t("modalCancelAction")}
        confirmLabel={
          isYourStrategySelected
            ? t("yourStrategyActivationAction")
            : t("presetActivationAction")
        }
        description={
          isYourStrategySelected && yourStrategyDraft
            ? t("yourStrategyActivationConfirmDescription").replace(
                "{symbol}",
                yourStrategyDraft.symbol,
              )
            : selectedPreset && draftConfig
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
        title={
          isYourStrategySelected
            ? t("yourStrategyActivationConfirmTitle")
            : t("presetActivationConfirmTitle")
        }
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

            <article
              className={`preset-card-lite ${isYourStrategySelected ? "featured" : ""}`}
            >
              <div className="row-between align-start">
                <div>
                  <h4>YOUR Strategy</h4>
                  <p>{t("yourStrategyDescription")}</p>
                </div>
                <span className="badge badge--info">{t("yourStrategyBadge")}</span>
              </div>

              <div className="chip-row compact">
                <span className="chip">{t("yourStrategyCardChipOne")}</span>
                <span className="chip">{t("yourStrategyCardChipTwo")}</span>
                <span className="chip">{t("yourStrategyCardChipThree")}</span>
              </div>

              <ul className="preset-priority-list">
                <li>{t("yourStrategyPriorityOne")}</li>
                <li>{t("yourStrategyPriorityTwo")}</li>
              </ul>

              <button
                className={`btn ${isYourStrategySelected ? "primary" : "secondary"} small`}
                onClick={() => handleSelectPreset(YOUR_STRATEGY_PRESET_DEFINITION_ID)}
                type="button"
              >
                {isYourStrategySelected
                  ? t("presetSelectSelected")
                  : t("yourStrategyCardAction")}
              </button>
            </article>
          </div>

          <section className="backtest-preview">
            <div className="row-between align-start section-gap">
              <div>
                <p className="panel-label">{t("presetBacktestEyebrow")}</p>
                <h3>{t("presetBacktestTitle")}</h3>
                <p className="panel-copy">
                  {selectedPreset || isYourStrategySelected
                    ? t("presetBacktestDescription")
                    : t("presetBacktestEmptyDescription")}
                </p>
              </div>
              <span className="badge badge--neutral">
                {selectedPreset || isYourStrategySelected
                  ? formatBacktestPeriodLabel(
                      activeBacktestPreview?.status === "success"
                        ? activeBacktestPreview
                        : null,
                    )
                  : t("presetBacktestBadgeIdle")}
              </span>
            </div>

            {!selectedPreset && !isYourStrategySelected ? (
              <div className="info-note">
                <strong>{t("presetBacktestEmptyTitle")}</strong>
                <p>{t("presetBacktestEmptyDescription")}</p>
              </div>
            ) : isBacktestLoading ? (
              <div className="info-note">
                <strong>{t("presetBacktestLoadingTitle")}</strong>
                <p>{t("presetBacktestLoadingDescription")}</p>
              </div>
            ) : activeBacktestPreview?.status === "success" ? (
              <div className="backtest-stack">
                <section className="metric-grid">
                  <article className="stat-panel emphasis">
                    <span>{t("presetBacktestMetricStrategy")}</span>
                    <strong
                      className={
                        activeBacktestPreview.summary.strategyReturnPercent >= 0 ? "up" : "down"
                      }
                    >
                      {formatPercent(activeBacktestPreview.summary.strategyReturnPercent)}
                    </strong>
                    <p>{t("presetBacktestMetricStrategyHint")}</p>
                  </article>
                  <article className="stat-panel">
                    <span>{t("presetBacktestMetricHold")}</span>
                    <strong
                      className={activeBacktestPreview.summary.holdReturnPercent >= 0 ? "up" : "down"}
                    >
                      {formatPercent(activeBacktestPreview.summary.holdReturnPercent)}
                    </strong>
                    <p>{t("presetBacktestMetricHoldHint")}</p>
                  </article>
                  <article className="stat-panel">
                    <span>{t("presetBacktestMetricAlpha")}</span>
                    <strong
                      className={activeBacktestPreview.summary.alphaVsHoldPercent >= 0 ? "up" : "down"}
                    >
                      {formatPercent(activeBacktestPreview.summary.alphaVsHoldPercent)}
                    </strong>
                    <p>{t("presetBacktestMetricAlphaHint")}</p>
                  </article>
                  <article className="stat-panel">
                    <span>{t("presetBacktestMetricDrawdown")}</span>
                    <strong className="down">
                      {formatPercent(activeBacktestPreview.summary.maxDrawdownPercent)}
                    </strong>
                    <p>{t("presetBacktestMetricDrawdownHint")}</p>
                  </article>
                  <article className="stat-panel">
                    <span>{t("presetBacktestMetricWinRate")}</span>
                    <strong>{formatPercent(activeBacktestPreview.summary.winRatePercent)}</strong>
                    <p>{t("presetBacktestMetricWinRateHint")}</p>
                  </article>
                  <article className="stat-panel">
                    <span>{t("presetBacktestMetricTrades")}</span>
                    <strong>{activeBacktestPreview.summary.totalTrades}</strong>
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
                    holdCurve={activeBacktestPreview.holdCurve}
                    strategyCurve={activeBacktestPreview.equityCurve}
                  />
                </div>

                <div className="backtest-summary-bar">
                  <span>
                    {t("presetBacktestEndingEquity").replace(
                      "{value}",
                      formatCurrency(activeBacktestPreview.summary.endingEquityUsd),
                    )}
                  </span>
                  <span>
                    {t("presetBacktestEndingHold").replace(
                      "{value}",
                      formatCurrency(activeBacktestPreview.summary.endingHoldEquityUsd),
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
                      {activeBacktestPreview.trades.length}
                    </span>
                  </div>

                  {activeBacktestPreview.trades.length > 0 ? (
                    <div className="history-stack">
                      {activeBacktestPreview.trades.slice(0, 6).map((trade) => (
                        <article key={trade.id} className="history-card">
                          <div>
                            <div className="trade-head">
                              <strong>{activeBacktestPreview.symbol}</strong>
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
                  <p>{activeBacktestPreview.assumptions.executionModel}</p>
                  <p>{activeBacktestPreview.assumptions.positionRule}</p>
                  <p>{activeBacktestPreview.assumptions.tpSlConflictRule}</p>
                </div>
              </div>
            ) : activeBacktestPreview ? (
              <div className="info-note">
                <strong>
                  {isYourStrategySelected
                    ? t("yourStrategyBacktestErrorTitle")
                    : t("presetBacktestErrorTitle")}
                </strong>
                <p>{activeBacktestPreview.message}</p>
              </div>
            ) : null}
          </section>
        </section>

        {!isYourStrategySelected ? (
          <section className="panel review-panel-wide">
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">
                {isYourStrategySelected
                  ? t("yourStrategyReviewEyebrow")
                  : t("presetReviewEyebrow")}
              </p>
              <h3>
                {isYourStrategySelected
                  ? t("yourStrategyReviewTitle")
                  : selectedPreset
                    ? selectedPreset.definition.name
                    : t("presetReviewEmptyTitle")}
              </h3>
              <p className="subtle">
                {isYourStrategySelected
                  ? t("yourStrategyReviewDescription")
                  : selectedPreset
                    ? selectedPreset.reviewSummary
                    : t("presetReviewEmptyDescription")}
              </p>
            </div>
            <span
              className={`badge badge--${
                isYourStrategySelected ? "info" : selectedPreset?.riskTone ?? "neutral"
              }`}
            >
              {isYourStrategySelected
                ? t("yourStrategyBadge")
                : selectedPreset
                  ? selectedPreset.definition.riskLabel
                  : t("presetReviewEmptyBadge")}
            </span>
          </div>

          {selectedPreset && draftConfig ? (
            <div className="form-split">
              <div className="form-stack">
                <label className="onboarding-form__field">
                  <span>{t("presetReviewSymbolLabel")}</span>
                  <select
                    className="onboarding-form__input"
                    onChange={(event) =>
                      updateDraftConfig(
                        "symbol",
                        event.target.value as PresetEditableConfig["symbol"],
                      )
                    }
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
        ) : null}

        {!isYourStrategySelected ? (
        <section className="panel activation-panel">
          <div>
            <p className="panel-label">
              {isYourStrategySelected
                ? t("yourStrategyPreviewPanelEyebrow")
                : t("presetActivationEyebrow")}
            </p>
            <h3>
              {selectedPreset || isYourStrategySelected
                ? t("presetActivationTitleReady")
                : t("presetActivationTitleIdle")}
            </h3>
            <p className="subtle">{activationSummary}</p>
          </div>

          {isYourStrategySelected ? (
            <div className="history-list">
              <div className="history-row">
                <div>
                  <strong>{t("yourStrategyActivationChecklistTitle")}</strong>
                  <p>
                    {yourStrategyRecord?.lastBacktestPreviewedAt
                      ? t("yourStrategyActivationChecklistReady")
                      : t("yourStrategyActivationNeedsPreview")}
                  </p>
                </div>
                <strong
                  className={
                    yourStrategyRecord?.lastBacktestPreviewedAt ? "up" : "down"
                  }
                >
                  {yourStrategyRecord?.lastBacktestPreviewedAt
                    ? t("yourStrategyChecklistReadyBadge")
                    : t("yourStrategyChecklistPendingBadge")}
                </strong>
              </div>
              <div className="history-row">
                <div>
                  <strong>{t("yourStrategyEditingPolicyTitle")}</strong>
                  <p>
                    {isYourStrategyEditingBlocked
                      ? t("yourStrategyEditingPolicyBlocked")
                      : t("yourStrategyEditingPolicyOpen")}
                  </p>
                </div>
                <strong className={isYourStrategyEditingBlocked ? "down" : "up"}>
                  {isYourStrategyEditingBlocked
                    ? t("yourStrategyChecklistBlockedBadge")
                    : t("yourStrategyChecklistOpenBadge")}
                </strong>
              </div>
              <div className="history-row">
                <div>
                  <strong>{t("yourStrategyPreviewSummaryTitle")}</strong>
                  <p>
                    {yourStrategyPreview?.status === "success"
                      ? t("yourStrategyPreviewSummaryReady").replace(
                          "{value}",
                          formatPercent(yourStrategyPreview.summary.strategyReturnPercent),
                        )
                      : t("yourStrategyPreviewHint")}
                  </p>
                </div>
                <strong>
                  {yourStrategyPreview?.status === "success"
                    ? t("yourStrategyChecklistReadyBadge")
                    : t("yourStrategyChecklistPendingBadge")}
                </strong>
              </div>
            </div>
          ) : null}

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
            {isYourStrategySelected ? (
              <>
                <button
                  className="btn secondary"
                  disabled={!canAccessProduct || !yourStrategyDraft || isYourStrategyEditingBlocked}
                  onClick={() => void handleSaveYourStrategy()}
                  type="button"
                >
                  {t("yourStrategySaveAction")}
                </button>
                <button
                  className="btn secondary"
                  disabled={!canAccessProduct || !yourStrategyDraft || isYourStrategyEditingBlocked}
                  onClick={() => void handlePreviewYourStrategy()}
                  type="button"
                >
                  {t("yourStrategyPreviewAction")}
                </button>
              </>
            ) : null}
            <button
              className="btn primary"
              disabled={
                !canAccessProduct ||
                (!isYourStrategySelected && (!selectedPreset || !draftConfig)) ||
                (isYourStrategySelected &&
                  (!yourStrategyDraft || isYourStrategyEditingBlocked)) ||
                state.presets.activationStatus === "loading"
              }
              onClick={handleActivationRequest}
              type="button"
            >
              {isYourStrategySelected
                ? t("yourStrategyActivationAction")
                : t("presetActivationAction")}
            </button>
          </div>
        </section>
        ) : null}
      </section>

      {isYourStrategySelected && isYourStrategyModalOpen ? (
        <div className="modal-overlay">
          <div className="modal-card profile-maintenance-modal your-strategy-modal">
            <div className="row-between align-start">
              <div>
                <p className="panel-label">{t("yourStrategyBuilderEyebrow")}</p>
                <h3>{t("yourStrategyBuilderTitle")}</h3>
                <p className="subtle">{t("yourStrategyBuilderDescription")}</p>
              </div>
              <button
                className="btn secondary"
                onClick={() => setIsYourStrategyModalOpen(false)}
                type="button"
              >
                {t("modalCloseAction")}
              </button>
            </div>

            <YourStrategyWizard
              activationMessage={state.presets.activationMessage}
              activationStatus={state.presets.activationStatus}
              canAccessProduct={canAccessProduct}
              currentStep={yourStrategyStep}
              draft={yourStrategyDraft}
              editingBlocked={isYourStrategyEditingBlocked}
              leverage={selectedLeverage}
              onActivate={() => void handleActivationRequest()}
              onAddIndicator={handleAddIndicator}
              onAddRule={handleAddYourStrategyRule}
              onFieldChange={handleUpdateYourStrategyField}
              onGroupTypeChange={handleUpdateYourStrategyGroupType}
              onIndicatorChange={handleUpdateIndicator}
              onIndicatorRemove={handleRemoveIndicator}
              onPreview={() => void handlePreviewYourStrategy()}
              onReload={() => void handleReloadYourStrategy()}
              onReset={handleResetYourStrategyDraft}
              onRuleChange={handleUpdateYourStrategyRule}
              onRuleRemove={handleRemoveYourStrategyRule}
              onSave={() => void handleSaveYourStrategy()}
              onSideToggle={handleToggleYourStrategySide}
              onStepChange={setYourStrategyStep}
              onStopLossAtrMultiplierChange={handleUpdateStopLossAtrMultiplier}
              onStopLossAtrPeriodChange={handleUpdateStopLossAtrPeriod}
              onStopLossModeChange={handleUpdateStopLossMode}
              onStopLossStaticValueChange={handleUpdateStopLossStaticValue}
              onTakeProfitToggle={handleUpdateTakeProfitEnabled}
              onTakeProfitMultipleChange={handleUpdateTakeProfitMultiple}
              preview={yourStrategyPreview}
              statusMessage={yourStrategyStatusMessage}
              statusTone={yourStrategyStatusTone}
              t={t}
              validationMessage={yourStrategyValidationMessage}
            />
          </div>
        </div>
      ) : null}
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

function createDefaultYourStrategyDraft(): YourStrategyDraft {
  return {
    name: "YOUR Strategy",
    symbol: "BTC/USDC",
    timeframe: "5m",
    indicators: {
      EMA1: { type: "ema", period: 9 },
      EMA2: { type: "ema", period: 21 },
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
              indicator: "EMA1",
              operator: "crossesAbove",
              ref: "EMA2",
            },
          ],
        },
      },
      short: {
        enabled: false,
        trigger: {
          type: "all",
          rules: [
            {
              scope: "currentCandle",
              type: "cross",
              indicator: "EMA1",
              operator: "crossesBelow",
              ref: "EMA2",
            },
          ],
        },
      },
    },
    risk: {
      stopLoss: {
        mode: "static",
        unit: "percent",
        value: 3,
      },
      takeProfit: {
        mode: "rr",
        multiple: 2,
      },
    },
    positionSizeType: "balance_percent",
    positionSizeValue: 5,
  };
}

function getFirstIndicatorKey(draft: YourStrategyDraft) {
  return Object.keys(draft.indicators)[0] ?? "EMA1";
}

function createDefaultThresholdRule(indicatorKey: string): PresetTriggerRule {
  return {
    scope: "currentCandle",
    type: "threshold",
    indicator: indicatorKey,
    operator: "above",
    value: 50,
  };
}

function createDefaultRuleForIndicator(
  indicators: Record<string, PresetIndicatorConfig>,
  indicatorKey: string,
): PresetTriggerRule {
  const indicator = indicators[indicatorKey];

  if (!indicator) {
    return createDefaultThresholdRule(indicatorKey);
  }

  if (getIndicatorContext(indicator) === "volume") {
    const referenceKey =
      getVolumeReferenceKeys(indicators)[0] ?? indicatorKey;

    return {
      scope: "currentCandle",
      type: "threshold",
      indicator: indicatorKey,
      operator: "above",
      ref: referenceKey,
    };
  }

  if (indicator.type === "rsi") {
    return {
      scope: "currentCandle",
      type: "threshold",
      indicator: indicatorKey,
      operator: "above",
      value: 50,
    };
  }

  if (getIndicatorContext(indicator) === "price") {
    return {
      scope: "currentCandle",
      type: "threshold",
      indicator: indicatorKey,
      operator: "above",
      ref: "PRICE",
    };
  }

  return createDefaultThresholdRule(indicatorKey);
}

function getIndicatorPrefix(indicator: PresetIndicatorConfig) {
  if (indicator.type === "volume") {
    return "VOLUME";
  }

  if (indicator.type === "sma" && indicator.source === "volume") {
    return "VOLUME_SMA";
  }

  if (indicator.type === "ema" && indicator.source === "volume") {
    return "VOLUME_EMA";
  }

  if (indicator.type === "sma") {
    return "SMA";
  }

  return indicator.type.toUpperCase();
}

function createIndicatorKeyForConfig(
  draft: YourStrategyDraft,
  indicator: PresetIndicatorConfig,
  currentKey?: string,
) {
  const existingKeys = new Set(
    Object.keys(draft.indicators).filter((key) => key !== currentKey),
  );
  const prefix = getIndicatorPrefix(indicator);

  for (let index = 1; index <= 99; index += 1) {
    const key = `${prefix}${index}`;

    if (!existingKeys.has(key)) {
      return key;
    }
  }

  return `${prefix}${existingKeys.size + 1}`;
}

function createIndicatorKeyForPrefix(
  draft: YourStrategyDraft,
  prefix: string,
  currentKey?: string,
) {
  const existingKeys = new Set(
    Object.keys(draft.indicators).filter((key) => key !== currentKey),
  );

  for (let index = 1; index <= 99; index += 1) {
    const key = `${prefix}${index}`;

    if (!existingKeys.has(key)) {
      return key;
    }
  }

  return `${prefix}${existingKeys.size + 1}`;
}

function addIndicatorToRecord(
  record: Record<string, PresetIndicatorConfig>,
  key: string,
  indicator: PresetIndicatorConfig,
) {
  record[key] = indicator;
  return key;
}

function sanitizeEntrySideIndicatorReferences(
  entrySide: YourStrategyDraft["entry"]["long"],
  removedIndicatorKey: string,
  fallbackIndicatorKey: string,
) {
  return {
    ...entrySide,
    trigger: {
      ...entrySide.trigger,
      rules: entrySide.trigger.rules.map((rule) => {
        if (rule.type === "threshold") {
          return rule.ref !== undefined
            ? {
                ...rule,
                indicator:
                  rule.indicator === removedIndicatorKey
                    ? fallbackIndicatorKey
                    : rule.indicator,
                ref: rule.ref === removedIndicatorKey ? fallbackIndicatorKey : rule.ref,
              }
            : {
                ...rule,
                indicator:
                  rule.indicator === removedIndicatorKey
                    ? fallbackIndicatorKey
                    : rule.indicator,
              };
        }

        return rule.ref !== undefined
          ? {
              ...rule,
              indicator:
                rule.indicator === removedIndicatorKey
                  ? fallbackIndicatorKey
                  : rule.indicator,
              ref: rule.ref === removedIndicatorKey ? fallbackIndicatorKey : rule.ref,
            }
          : {
              ...rule,
              indicator:
                rule.indicator === removedIndicatorKey
                  ? fallbackIndicatorKey
                  : rule.indicator,
            };
      }),
    },
  };
}

function renameEntrySideIndicatorReferences(
  entrySide: YourStrategyDraft["entry"]["long"],
  previousKey: string,
  nextKey: string,
) {
  if (previousKey === nextKey) {
    return entrySide;
  }

  return {
    ...entrySide,
    trigger: {
      ...entrySide.trigger,
      rules: entrySide.trigger.rules.map((rule) => {
        if (rule.type === "threshold") {
          return rule.ref !== undefined
            ? {
                ...rule,
                indicator: rule.indicator === previousKey ? nextKey : rule.indicator,
                ref: rule.ref === previousKey ? nextKey : rule.ref,
              }
            : {
                ...rule,
                indicator: rule.indicator === previousKey ? nextKey : rule.indicator,
              };
        }

        return rule.ref !== undefined
          ? {
              ...rule,
              indicator: rule.indicator === previousKey ? nextKey : rule.indicator,
              ref: rule.ref === previousKey ? nextKey : rule.ref,
            }
          : {
              ...rule,
              indicator: rule.indicator === previousKey ? nextKey : rule.indicator,
            };
      }),
    },
  };
}

function ensureVolumeSupportDraft(draft: YourStrategyDraft) {
  const hasVolumeIndicator = Object.values(draft.indicators).some(
    (indicator) => indicator.type === "volume",
  );

  if (!hasVolumeIndicator) {
    return draft;
  }

  const hasVolumeMovingAverage = Object.values(draft.indicators).some(
    (indicator) =>
      (indicator.type === "sma" || indicator.type === "ema") &&
      indicator.source === "volume",
  );

  if (hasVolumeMovingAverage) {
    return draft;
  }

  const nextKey = createIndicatorKeyForConfig(
    draft,
    {
      type: "sma",
      source: "volume",
      period: 20,
    },
  );

  return {
    ...draft,
    indicators: {
      ...draft.indicators,
      [nextKey]: {
        type: "sma",
        source: "volume",
        period: 20,
      } satisfies PresetIndicatorConfig,
    },
  };
}

function getIndicatorContext(indicator: PresetIndicatorConfig) {
  if (indicator.type === "volume") {
    return "volume";
  }

  if (
    (indicator.type === "sma" || indicator.type === "ema") &&
    indicator.source === "volume"
  ) {
    return "volume";
  }

  if (indicator.type === "rsi") {
    return "rsi";
  }

  if (indicator.type === "atr") {
    return "atr";
  }

  return "price";
}

function getReferenceContext(
  indicators: Record<string, PresetIndicatorConfig>,
  reference: string,
) {
  if (reference === "PRICE") {
    return "price";
  }

  const indicator = indicators[reference];
  return indicator ? getIndicatorContext(indicator) : null;
}

function isVolumeDerivedIndicator(indicator: PresetIndicatorConfig) {
  return (
    (indicator.type === "sma" || indicator.type === "ema") &&
    indicator.source === "volume"
  );
}

function getIndicatorPeriod(indicator: PresetIndicatorConfig | null | undefined) {
  return indicator && "period" in indicator ? indicator.period : 20;
}

function normalizeYourStrategyDraftForBuilder(draft: YourStrategyDraft): YourStrategyDraft {
  const indicatorEntries = Object.entries(draft.indicators);
  const keyMap = new Map<string, string>();
  const nextIndicators: Record<string, PresetIndicatorConfig> = {};

  indicatorEntries.forEach(([previousKey, indicator]) => {
    const nextKey = createIndicatorKeyForConfig(
      {
        ...draft,
        indicators: nextIndicators,
      },
      indicator,
    );
    keyMap.set(previousKey, nextKey);
    nextIndicators[nextKey] = indicator;
  });

  const renameRuleKey = (key: string) => keyMap.get(key) ?? key;

  return ensureVolumeSupportDraft({
    ...draft,
    indicators: nextIndicators,
    entry: {
      long: {
        ...draft.entry.long,
        trigger: {
          ...draft.entry.long.trigger,
          rules: draft.entry.long.trigger.rules.map((rule) =>
            rule.type === "threshold"
              ? rule.ref !== undefined
                ? {
                    ...rule,
                    indicator: renameRuleKey(rule.indicator),
                    ref: renameRuleKey(rule.ref),
                  }
                : {
                    ...rule,
                    indicator: renameRuleKey(rule.indicator),
                  }
              : rule.ref !== undefined
                ? {
                    ...rule,
                    indicator: renameRuleKey(rule.indicator),
                    ref: renameRuleKey(rule.ref),
                  }
                : {
                    ...rule,
                    indicator: renameRuleKey(rule.indicator),
                  },
          ),
        },
      },
      short: {
        ...draft.entry.short,
        trigger: {
          ...draft.entry.short.trigger,
          rules: draft.entry.short.trigger.rules.map((rule) =>
            rule.type === "threshold"
              ? rule.ref !== undefined
                ? {
                    ...rule,
                    indicator: renameRuleKey(rule.indicator),
                    ref: renameRuleKey(rule.ref),
                  }
                : {
                    ...rule,
                    indicator: renameRuleKey(rule.indicator),
                  }
              : rule.ref !== undefined
                ? {
                    ...rule,
                    indicator: renameRuleKey(rule.indicator),
                    ref: renameRuleKey(rule.ref),
                  }
                : {
                    ...rule,
                    indicator: renameRuleKey(rule.indicator),
                  },
          ),
        },
      },
    },
  });
}

type TranslationFn = ReturnType<typeof useI18n>["t"];

function getYourStrategyWizardSteps(
  t: TranslationFn,
  draft: YourStrategyDraft | null,
) {
  const steps = [
    {
      key: "market",
      eyebrow: t("yourStrategyStepOneEyebrow"),
      title: t("yourStrategyStepOneTitle"),
      summary: draft
        ? t("yourStrategyStepOneSummary")
            .replace("{symbol}", draft.symbol)
            .replace("{timeframe}", draft.timeframe)
        : t("yourStrategyStepOneFallback"),
    },
    {
      key: "indicators",
      eyebrow: t("yourStrategyStepTwoEyebrow"),
      title: t("yourStrategyStepTwoTitle"),
      summary: draft
        ? t("yourStrategyStepTwoSummary").replace(
            "{count}",
            String(Object.keys(draft.indicators).length),
          )
        : t("yourStrategyStepTwoFallback"),
    },
    draft?.entry.long.enabled
      ? {
          key: "long",
      eyebrow: t("yourStrategyStepThreeEyebrow"),
      title: t("yourStrategyStepThreeTitle"),
      summary: draft
        ? t("yourStrategyStepThreeSummary").replace(
            "{count}",
            String(draft.entry.long.trigger.rules.length),
          )
        : t("yourStrategyStepThreeFallback"),
        }
      : null,
    draft?.entry.short.enabled
      ? {
          key: "short",
      eyebrow: t("yourStrategyStepFourEyebrow"),
      title: t("yourStrategyStepFourTitle"),
      summary: draft
        ? t("yourStrategyStepFourSummary").replace(
            "{count}",
            String(draft.entry.short.trigger.rules.length),
          )
        : t("yourStrategyStepFourFallback"),
        }
      : null,
    {
      key: "risk",
      eyebrow: t("yourStrategyStepFiveEyebrow"),
      title: t("yourStrategyStepFiveTitle"),
      summary: draft
        ? t("yourStrategyStepFiveSummary")
            .replace("{size}", `${draft.positionSizeValue}%`)
        : t("yourStrategyStepFiveFallback"),
    },
    {
      key: "take-profit",
      eyebrow: t("yourStrategyStepSixEyebrow"),
      title: t("yourStrategyStepSixTitle"),
      summary: draft
        ? t("yourStrategyStepSixSummary").replace(
            "{tp}",
            draft.risk.takeProfit
              ? t("yourStrategyTakeProfitOn")
              : t("yourStrategyTakeProfitOff"),
          )
        : t("yourStrategyStepSixFallback"),
    },
    {
      key: "preview",
      eyebrow: t("yourStrategyStepSevenEyebrow"),
      title: t("yourStrategyStepSevenTitle"),
      summary: t("yourStrategyStepSevenSummary"),
    },
  ].filter(Boolean);

  return steps as Array<{
    key: "market" | "indicators" | "long" | "short" | "risk" | "take-profit" | "preview";
    eyebrow: string;
    title: string;
    summary: string;
  }>;
}

function formatActivationBlocker(t: TranslationFn, blocker: string) {
  switch (blocker) {
    case "take_profit_missing":
      return t("yourStrategyIssueTakeProfitMissing");
    case "unsupported_position_size_type":
      return t("yourStrategyIssueUnsupportedPositionSize");
    default:
      return blocker;
  }
}

function getCompatibleIndicatorKeys(
  indicators: Record<string, PresetIndicatorConfig>,
  selectedIndicatorKey: string,
) {
  const selectedIndicator = indicators[selectedIndicatorKey];

  if (!selectedIndicator) {
    return Object.keys(indicators);
  }

  const selectedContext = getIndicatorContext(selectedIndicator);

  return Object.entries(indicators)
    .filter(([, indicator]) => getIndicatorContext(indicator) === selectedContext)
    .map(([indicatorKey]) => indicatorKey);
}

function getVisibleBuilderIndicators(indicators: Record<string, PresetIndicatorConfig>) {
  return Object.fromEntries(
    Object.entries(indicators).filter(
      ([, indicator]) => indicator.type !== "atr" && !isVolumeDerivedIndicator(indicator),
    ),
  );
}

function getPriceIndicatorKeys(indicators: Record<string, PresetIndicatorConfig>) {
  return Object.entries(indicators)
    .filter(([, indicator]) => getIndicatorContext(indicator) === "price")
    .map(([indicatorKey]) => indicatorKey);
}

function getRsiIndicatorKeys(indicators: Record<string, PresetIndicatorConfig>) {
  return Object.entries(indicators)
    .filter(([, indicator]) => getIndicatorContext(indicator) === "rsi")
    .map(([indicatorKey]) => indicatorKey);
}

function getVolumeBaselineKeys(indicators: Record<string, PresetIndicatorConfig>) {
  return Object.entries(indicators)
    .filter(([, indicator]) => indicator.type === "volume")
    .map(([indicatorKey]) => indicatorKey);
}

function getVolumeReferenceKeys(indicators: Record<string, PresetIndicatorConfig>) {
  return Object.entries(indicators)
    .filter(([, indicator]) => isVolumeDerivedIndicator(indicator))
    .map(([indicatorKey]) => indicatorKey);
}

function getVolumeCompanionKey(
  indicators: Record<string, PresetIndicatorConfig>,
  volumeIndicatorKey: string,
) {
  return getVolumeReferenceKeys(indicators).find((indicatorKey) => indicatorKey !== volumeIndicatorKey) ?? null;
}

function getYourStrategyIssues(t: TranslationFn, draft: YourStrategyDraft) {
  const issues: string[] = [];

  if (!draft.entry.long.enabled && !draft.entry.short.enabled) {
    issues.push(t("yourStrategyIssueEnableOneSide"));
  }

  const sides: Array<{ key: "long" | "short"; label: string }> = [
    { key: "long", label: t("presetReviewLongLabel") },
    { key: "short", label: t("presetReviewShortLabel") },
  ];

  sides.forEach(({ key, label }) => {
    const side = draft.entry[key];

    if (side.enabled && side.trigger.rules.length === 0) {
      issues.push(
        t("yourStrategyIssueMissingRules").replace("{side}", label),
      );
    }

    side.trigger.rules.forEach((rule, ruleIndex) => {
      const indicator = draft.indicators[rule.indicator];

      if (!indicator) {
        issues.push(
          t("yourStrategyIssueMissingIndicator")
            .replace("{side}", label)
            .replace("{rule}", String(ruleIndex + 1))
            .replace("{indicator}", rule.indicator),
        );
        return;
      }

      if (rule.type === "threshold" && getIndicatorContext(indicator) === "volume") {
        if (rule.ref === undefined) {
          issues.push(
            t("yourStrategyIssueVolumeThreshold")
              .replace("{side}", label)
              .replace("{rule}", String(ruleIndex + 1)),
          );
        }
      }

      if (rule.type === "threshold" && rule.ref !== undefined) {
        const referenceContext = getReferenceContext(draft.indicators, rule.ref);

        if (referenceContext === null) {
          issues.push(
            t("yourStrategyIssueMissingReference")
              .replace("{side}", label)
              .replace("{rule}", String(ruleIndex + 1))
              .replace("{indicator}", rule.ref),
          );
          return;
        }

        if (getIndicatorContext(indicator) !== referenceContext) {
          issues.push(
            t("yourStrategyIssueThresholdContextMismatch")
              .replace("{side}", label)
              .replace("{rule}", String(ruleIndex + 1))
              .replace("{left}", rule.indicator)
              .replace("{right}", rule.ref),
          );
        }
      }

      if (rule.type === "cross" && rule.ref !== undefined) {
        const referenceContext = getReferenceContext(draft.indicators, rule.ref);

        if (referenceContext === null) {
          issues.push(
            t("yourStrategyIssueMissingReference")
              .replace("{side}", label)
              .replace("{rule}", String(ruleIndex + 1))
              .replace("{indicator}", rule.ref),
          );
          return;
        }

        if (getIndicatorContext(indicator) !== referenceContext) {
          issues.push(
            t("yourStrategyIssueCrossContextMismatch")
              .replace("{side}", label)
              .replace("{rule}", String(ruleIndex + 1))
              .replace("{left}", rule.indicator)
              .replace("{right}", rule.ref),
          );
        }
      }

      if (
        indicator.type === "rsi" &&
        rule.value !== undefined &&
        (rule.value < 0 || rule.value > 100)
      ) {
        issues.push(
          t("yourStrategyIssueRsiRange")
            .replace("{side}", label)
            .replace("{rule}", String(ruleIndex + 1)),
        );
      }

      if (indicator.type === "atr") {
        issues.push(
          t("yourStrategyIssueAtrUsage")
            .replace("{side}", label)
            .replace("{rule}", String(ruleIndex + 1)),
        );
      }
    });
  });

  return issues;
}

function describeIndicator(indicatorKey: string, indicator: PresetIndicatorConfig) {
  switch (indicator.type) {
    case "volume":
      return `${indicatorKey}: Volume baseline`;
    case "ema":
      return indicator.source === "volume"
        ? `${indicatorKey}: EMA ${indicator.period} on volume`
        : `${indicatorKey}: EMA ${indicator.period}`;
    case "sma":
      return indicator.source === "volume"
        ? `${indicatorKey}: SMA ${indicator.period} on volume`
        : `${indicatorKey}: SMA ${indicator.period} on price`;
    case "rsi":
      return `${indicatorKey}: RSI ${indicator.period}`;
    case "atr":
      return `${indicatorKey}: ATR ${indicator.period}`;
  }
}

function describeRule(rule: PresetTriggerRule) {
  if (rule.type === "threshold") {
    return `${rule.indicator} ${rule.operator} ${rule.ref ?? rule.value}`;
  }

  return `${rule.indicator} ${rule.operator} ${rule.ref ?? rule.value}`;
}

function YourStrategyWizard(input: {
  t: TranslationFn;
  currentStep: number;
  draft: YourStrategyDraft | null;
  validationMessage: string | null;
  statusTone: "neutral" | "info" | "success" | "danger";
  statusMessage: string | null;
  activationStatus: "idle" | "loading" | "success" | "error";
  activationMessage: string | null;
  preview: YourStrategyBacktestPreviewResponse | null;
  editingBlocked: boolean;
  canAccessProduct: boolean;
  leverage: number | null;
  onStepChange: (step: number) => void;
  onFieldChange: <
    K extends keyof Pick<YourStrategyDraft, "name" | "symbol" | "timeframe" | "positionSizeValue">
  >(
    field: K,
    value: YourStrategyDraft[K],
  ) => void;
  onSideToggle: (side: "long" | "short") => void;
  onGroupTypeChange: (side: "long" | "short", type: "all" | "any") => void;
  onRuleChange: (
    side: "long" | "short",
    ruleIndex: number,
    updater: (rule: PresetTriggerRule) => PresetTriggerRule,
  ) => void;
  onAddRule: (side: "long" | "short") => void;
  onRuleRemove: (side: "long" | "short", ruleIndex: number) => void;
  onAddIndicator: () => void;
  onIndicatorChange: (indicatorKey: string, nextIndicator: PresetIndicatorConfig) => void;
  onIndicatorRemove: (indicatorKey: string) => void;
  onStopLossStaticValueChange: (value: number) => void;
  onStopLossModeChange: (mode: "static" | "atr") => void;
  onStopLossAtrPeriodChange: (period: number) => void;
  onStopLossAtrMultiplierChange: (multiplier: number) => void;
  onTakeProfitToggle: (enabled: boolean) => void;
  onTakeProfitMultipleChange: (multiple: number) => void;
  onReset: () => void;
  onReload: () => void;
  onSave: () => void;
  onPreview: () => void;
  onActivate: () => void;
}) {
  const {
    activationMessage,
    activationStatus,
    canAccessProduct,
    currentStep,
    draft,
    editingBlocked,
    leverage,
    onActivate,
    onAddIndicator,
    onAddRule,
    onFieldChange,
    onGroupTypeChange,
    onIndicatorChange,
    onIndicatorRemove,
    onStopLossAtrMultiplierChange,
    onStopLossAtrPeriodChange,
    onStopLossStaticValueChange,
    onPreview,
    onReload,
    onReset,
    onRuleChange,
    onRuleRemove,
    onSave,
    onSideToggle,
    onStepChange,
    onStopLossModeChange,
    onTakeProfitMultipleChange,
    onTakeProfitToggle,
    preview,
    statusMessage,
    statusTone,
    t,
    validationMessage,
  } = input;

  if (!draft) {
    return (
      <div className="info-note">
        <strong>{t("yourStrategyStatusIdle")}</strong>
        <p>{statusMessage ?? t("yourStrategyStatusNoSavedDraft")}</p>
      </div>
    );
  }

  const steps = getYourStrategyWizardSteps(t, draft);
  const resolvedCurrentStep = Math.min(Math.max(currentStep, 1), steps.length);
  const currentStepKey = steps[resolvedCurrentStep - 1]?.key ?? "market";
  const visibleIndicators = getVisibleBuilderIndicators(draft.indicators);
  const indicatorKeys = Object.keys(visibleIndicators);
  const controlsDisabled = !canAccessProduct || editingBlocked;
  const strategyIssues = getYourStrategyIssues(t, draft);
  const canAdvanceFromStepOne = draft.entry.long.enabled || draft.entry.short.enabled;

  return (
    <div className="your-strategy-builder">
      {editingBlocked ? (
        <div className="status-row status-row--danger blocked-surface">
          <span className="status-dot status-dot--danger"></span>
          <div>
            <strong>{t("yourStrategyEditingBlockedTitle")}</strong>
            <p>{t("yourStrategyEditingBlockedDescription")}</p>
          </div>
        </div>
      ) : null}

      {currentStepKey === "market" ? (
        <div className="form-split">
          <div className="form-stack">
            <label className="onboarding-form__field">
              <span>{t("yourStrategyNameLabel")}</span>
              <input
                className="onboarding-form__input"
                disabled={controlsDisabled}
                onChange={(event) => onFieldChange("name", event.target.value)}
                type="text"
                value={draft.name}
              />
            </label>
            <label className="onboarding-form__field">
              <span>{t("presetReviewSymbolLabel")}</span>
              <select
                className="onboarding-form__input"
                disabled={controlsDisabled}
                onChange={(event) =>
                  onFieldChange("symbol", event.target.value as YourStrategyDraft["symbol"])
                }
                value={draft.symbol}
              >
                {allowedPresetSymbols.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </label>
            <label className="onboarding-form__field">
              <span>{t("yourStrategyTimeframeLabel")}</span>
              <select
                className="onboarding-form__input"
                disabled={controlsDisabled}
                onChange={(event) =>
                  onFieldChange(
                    "timeframe",
                    event.target.value as YourStrategyDraft["timeframe"],
                  )
                }
                value={draft.timeframe}
              >
                <option value="3m">3m</option>
                <option value="5m">5m</option>
                <option value="15m">15m</option>
              </select>
            </label>
          </div>

          <div className="toggle-box your-strategy-toggle-panel">
            <div className="toggle-row">
              <span className="your-strategy-toggle-label your-strategy-toggle-label--long">
                {t("presetReviewLongLabel")}
              </span>
              <button
                aria-pressed={draft.entry.long.enabled}
                className={`toggle ${draft.entry.long.enabled ? "on" : "off"}`}
                disabled={controlsDisabled}
                onClick={() => onSideToggle("long")}
                type="button"
              >
                <span className="toggle__thumb"></span>
              </button>
            </div>
            <div className="toggle-row">
              <span className="your-strategy-toggle-label your-strategy-toggle-label--short">
                {t("presetReviewShortLabel")}
              </span>
              <button
                aria-pressed={draft.entry.short.enabled}
                className={`toggle ${draft.entry.short.enabled ? "on" : "off"}`}
                disabled={controlsDisabled}
                onClick={() => onSideToggle("short")}
                type="button"
              >
                <span className="toggle__thumb"></span>
              </button>
            </div>
            <div className="done-note">
              <strong>{t("yourStrategyLeverageTitle")}</strong>
              <p>
                {leverage ? `${leverage}x` : "-"} · {t("presetReviewLeverageHint")}
              </p>
            </div>
            {!canAdvanceFromStepOne ? (
              <div className="info-note">
                <strong>{t("yourStrategyIssueEnableOneSideTitle")}</strong>
                <p>{t("yourStrategyIssueEnableOneSide")}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {currentStepKey === "indicators" ? (
        <div className="form-stack">
          <div className="action-row">
            <button
              className="btn secondary"
              disabled={controlsDisabled}
              onClick={onAddIndicator}
              type="button"
            >
              {t("yourStrategyAddIndicatorAction")}
            </button>
          </div>
          <div className="history-stack">
            {indicatorKeys.map((indicatorKey) => {
              const indicator = visibleIndicators[indicatorKey];

              if (!indicator) {
                return null;
              }

              return (
                <IndicatorEditorCard
                  disabled={controlsDisabled}
                  indicator={indicator}
                  indicatorKey={indicatorKey}
                  indicators={draft.indicators}
                  key={indicatorKey}
                  onChange={onIndicatorChange}
                  onRemove={onIndicatorRemove}
                  t={t}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {currentStepKey === "long" ? (
        <EntrySideWizardSection
          disabled={controlsDisabled}
          indicators={visibleIndicators}
          onAddRule={() => onAddRule("long")}
          onGroupTypeChange={(type) => onGroupTypeChange("long", type)}
          onRuleChange={(ruleIndex, updater) => onRuleChange("long", ruleIndex, updater)}
          onRuleRemove={(ruleIndex) => onRuleRemove("long", ruleIndex)}
          side={draft.entry.long}
          t={t}
          tone="long"
          title={t("yourStrategyLongRulesTitle")}
        />
      ) : null}

      {currentStepKey === "short" ? (
        <EntrySideWizardSection
          disabled={controlsDisabled}
          indicators={visibleIndicators}
          onAddRule={() => onAddRule("short")}
          onGroupTypeChange={(type) => onGroupTypeChange("short", type)}
          onRuleChange={(ruleIndex, updater) => onRuleChange("short", ruleIndex, updater)}
          onRuleRemove={(ruleIndex) => onRuleRemove("short", ruleIndex)}
          side={draft.entry.short}
          t={t}
          tone="short"
          title={t("yourStrategyShortRulesTitle")}
        />
      ) : null}

      {currentStepKey === "risk" ? (
        <div className="form-split">
          <div className="form-stack">
            <label className="onboarding-form__field">
              <span>{t("yourStrategyStopLossLabel")}</span>
              <select
                className="onboarding-form__input"
                disabled={controlsDisabled}
                onChange={(event) =>
                  onStopLossModeChange(event.target.value as "static" | "atr")
                }
                value={draft.risk.stopLoss.mode}
              >
                <option value="static">{t("yourStrategyStopLossStatic")}</option>
                <option value="atr">{t("yourStrategyStopLossAtr")}</option>
              </select>
            </label>

            {draft.risk.stopLoss.mode === "static" ? (
              <label className="onboarding-form__field">
                <span>{t("yourStrategyStopLossStaticValueLabel")}</span>
                <div className="position-size-field">
                  <input
                    className="onboarding-form__input"
                    disabled={controlsDisabled}
                    min={0.1}
                    onChange={(event) =>
                      onStopLossStaticValueChange(Number(event.target.value))
                    }
                    step={0.1}
                    type="number"
                    value={draft.risk.stopLoss.value}
                  />
                  <span className="position-size-suffix">%</span>
                </div>
              </label>
            ) : (
              <div className="your-strategy-inline-grid form-stack">
                <label className="onboarding-form__field">
                  <span>{t("yourStrategyStopLossAtrPeriodLabel")}</span>
                  <input
                    className="onboarding-form__input"
                    disabled={controlsDisabled}
                    min={1}
                    onChange={(event) =>
                      onStopLossAtrPeriodChange(Number(event.target.value))
                    }
                    type="number"
                    value={draft.risk.stopLoss.period}
                  />
                </label>
                <label className="onboarding-form__field">
                  <span>{t("yourStrategyStopLossAtrMultiplierLabel")}</span>
                  <input
                    className="onboarding-form__input"
                    disabled={controlsDisabled}
                    min={0.1}
                    onChange={(event) =>
                      onStopLossAtrMultiplierChange(Number(event.target.value))
                    }
                    step={0.1}
                    type="number"
                    value={draft.risk.stopLoss.multiplier}
                  />
                </label>
              </div>
            )}

            <label className="onboarding-form__field">
              <span>{t("presetReviewPositionSizeLabel")}</span>
              <div className="position-size-field">
                <input
                  className="onboarding-form__input"
                  disabled={controlsDisabled}
                  min={1}
                  onChange={(event) =>
                    onFieldChange("positionSizeValue", Number(event.target.value))
                  }
                  type="number"
                  value={draft.positionSizeValue}
                />
                <span className="position-size-suffix">%</span>
              </div>
            </label>
          </div>

          <div className="done-note your-strategy-side-note">
            <strong>{t("yourStrategyRiskStepTitle")}</strong>
            <p>
              {draft.risk.stopLoss.mode === "static"
                ? t("yourStrategyRiskStepStaticSummary").replace(
                    "{value}",
                    String(draft.risk.stopLoss.value),
                  )
                : t("yourStrategyRiskStepAtrSummary")
                    .replace("{period}", String(draft.risk.stopLoss.period))
                    .replace(
                      "{multiplier}",
                      String(draft.risk.stopLoss.multiplier),
                    )}
            </p>
          </div>
        </div>
      ) : null}

      {currentStepKey === "take-profit" ? (
        <div className="form-stack">
          <div className="toggle-box your-strategy-toggle-panel">
            <div className="toggle-row">
              <span>{t("yourStrategyTakeProfitLabel")}</span>
              <button
                aria-pressed={draft.risk.takeProfit !== null}
                className={`toggle ${draft.risk.takeProfit ? "on" : "off"}`}
                disabled={controlsDisabled}
                onClick={() => onTakeProfitToggle(draft.risk.takeProfit === null)}
                type="button"
              >
                <span className="toggle__thumb"></span>
              </button>
            </div>

            {draft.risk.takeProfit ? (
              <label className="onboarding-form__field">
                <span>{t("yourStrategyTakeProfitMultipleLabel")}</span>
                <div className="position-size-field">
                  <input
                    className="onboarding-form__input"
                    disabled={controlsDisabled}
                    min={0.1}
                    onChange={(event) =>
                      onTakeProfitMultipleChange(Number(event.target.value))
                    }
                    step={0.1}
                    type="number"
                    value={draft.risk.takeProfit.multiple}
                  />
                  <span className="position-size-suffix">R</span>
                </div>
              </label>
            ) : (
              <div className="done-note warning-note">
                <strong>{t("yourStrategyTakeProfitOff")}</strong>
                <p>{t("yourStrategyTakeProfitWarning")}</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {currentStepKey === "preview" ? (
        <div className="form-stack">
          <div className="done-note">
            <strong>{t("yourStrategyPreviewHintTitle")}</strong>
            <p>{t("yourStrategyPreviewHint")}</p>
          </div>

          {preview?.status === "success" ? (
            <div className="metric-grid">
              <article className="stat-panel emphasis">
                <span>{t("presetBacktestMetricStrategy")}</span>
                <strong className={preview.summary.strategyReturnPercent >= 0 ? "up" : "down"}>
                  {formatPercent(preview.summary.strategyReturnPercent)}
                </strong>
                <p>{t("presetBacktestMetricStrategyHint")}</p>
              </article>
              <article className="stat-panel">
                <span>{t("presetBacktestMetricHold")}</span>
                <strong className={preview.summary.holdReturnPercent >= 0 ? "up" : "down"}>
                  {formatPercent(preview.summary.holdReturnPercent)}
                </strong>
                <p>{t("presetBacktestMetricHoldHint")}</p>
              </article>
              <article className="stat-panel">
                <span>{t("presetBacktestMetricDrawdown")}</span>
                <strong className="down">
                  {formatPercent(preview.summary.maxDrawdownPercent)}
                </strong>
                <p>{t("presetBacktestMetricDrawdownHint")}</p>
              </article>
              <article className="stat-panel">
                <span>{t("presetBacktestMetricTrades")}</span>
                <strong>{preview.summary.totalTrades}</strong>
                <p>{t("presetBacktestMetricTradesHint")}</p>
              </article>
            </div>
          ) : preview?.status === "error" ? (
            <div className="info-note">
              <strong>{t("yourStrategyBacktestErrorTitle")}</strong>
              <p>{preview.message}</p>
              {"activationBlockers" in preview && preview.activationBlockers?.length ? (
                <ul className="summary-list">
                  {preview.activationBlockers.map((blocker) => (
                    <li key={blocker}>{formatActivationBlocker(t, blocker)}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="rule-group-card">
            <div>
              <p className="panel-label">{t("yourStrategySummaryEyebrow")}</p>
              <h4>{t("yourStrategySummaryTitle")}</h4>
            </div>
            <div className="summary-grid">
              <div className="done-note">
                <strong>{t("yourStrategySummaryIndicatorsTitle")}</strong>
                <ul className="summary-list">
                  {indicatorKeys.map((indicatorKey) => (
                    <li key={indicatorKey}>
                      {describeIndicator(indicatorKey, visibleIndicators[indicatorKey]!)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="done-note">
                <strong>{t("yourStrategySummaryLongTitle")}</strong>
                <ul className="summary-list">
                  {draft.entry.long.trigger.rules.map((rule, index) => (
                    <li key={`long-${index}`}>{describeRule(rule)}</li>
                  ))}
                </ul>
              </div>
              <div className="done-note">
                <strong>{t("yourStrategySummaryShortTitle")}</strong>
                <ul className="summary-list">
                  {draft.entry.short.trigger.rules.map((rule, index) => (
                    <li key={`short-${index}`}>{describeRule(rule)}</li>
                  ))}
                </ul>
              </div>
              <div className="done-note">
                <strong>{t("yourStrategySummaryRiskTitle")}</strong>
                <ul className="summary-list">
                  <li>
                    {draft.risk.stopLoss.mode === "static"
                      ? t("yourStrategyRiskStepStaticSummary").replace(
                          "{value}",
                          String(draft.risk.stopLoss.value),
                        )
                      : t("yourStrategyRiskStepAtrSummary")
                          .replace("{period}", String(draft.risk.stopLoss.period))
                          .replace(
                            "{multiplier}",
                            String(draft.risk.stopLoss.multiplier),
                          )}
                  </li>
                  <li>{`${t("presetReviewPositionSizeLabel")}: ${draft.positionSizeValue}%`}</li>
                  <li>
                    {draft.risk.takeProfit
                      ? t("yourStrategyTakeProfitSummary").replace(
                          "{multiple}",
                          String(draft.risk.takeProfit.multiple),
                        )
                      : t("yourStrategyTakeProfitSummaryOff")}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {draft.risk.takeProfit === null ? (
            <div className="info-note">
              <strong>{t("yourStrategyTakeProfitOff")}</strong>
              <p>{t("yourStrategyTakeProfitPreviewWarning")}</p>
            </div>
          ) : null}

          {strategyIssues.length > 0 ? (
            <div className="info-note">
              <strong>{t("yourStrategyIssuePanelTitle")}</strong>
              <ul className="summary-list">
                {strategyIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="status-stack">
            <div
              className={`status-row ${
                activationStatus === "success"
                  ? "status-row--success"
                  : activationStatus === "error"
                    ? "status-row--danger"
                    : activationStatus === "loading"
                      ? "status-row--info"
                      : "status-row--neutral"
              }`}
            >
              <span
                className={`status-dot ${
                  activationStatus === "success"
                    ? "status-dot--success"
                    : activationStatus === "error"
                      ? "status-dot--danger"
                      : activationStatus === "loading"
                        ? "status-dot--info"
                        : "status-dot--neutral"
                }`}
              ></span>
              <div>
                <strong>
                  {activationStatus === "success"
                    ? t("presetActivationStatusSuccess")
                    : activationStatus === "error"
                      ? t("presetActivationStatusError")
                      : activationStatus === "loading"
                        ? t("presetActivationStatusLoading")
                        : t("presetActivationStatusIdle")}
                </strong>
                <p>{activationMessage ?? t("yourStrategyActivationNeedsPreview")}</p>
              </div>
            </div>
          </div>

          <div className="action-row">
            <button
              className="btn secondary"
              disabled={controlsDisabled}
              onClick={onSave}
              type="button"
            >
              {t("yourStrategySaveAction")}
            </button>
            <button
              className="btn secondary"
              disabled={controlsDisabled}
              onClick={onPreview}
              type="button"
            >
              {t("yourStrategyPreviewAction")}
            </button>
            <button
              className="btn primary"
              disabled={controlsDisabled || activationStatus === "loading"}
              onClick={onActivate}
              type="button"
            >
              {t("yourStrategyActivationAction")}
            </button>
          </div>
        </div>
      ) : null}

      {validationMessage ? (
        <div className="info-note">
          <strong>{t("yourStrategyEditorErrorTitle")}</strong>
          <p>{validationMessage}</p>
        </div>
      ) : null}

      <div
        className={`status-row status-row--${
          statusTone === "danger"
            ? "danger"
            : statusTone === "success"
              ? "success"
              : statusTone === "info"
                ? "info"
                : "neutral"
        }`}
      >
        <span
          className={`status-dot status-dot--${
            statusTone === "danger"
              ? "danger"
              : statusTone === "success"
                ? "success"
                : statusTone === "info"
                  ? "info"
                  : "neutral"
          }`}
        ></span>
        <div>
          <strong>
            {statusTone === "danger"
              ? t("yourStrategyStatusError")
              : statusTone === "success"
                ? t("yourStrategyStatusSuccess")
                : statusTone === "info"
                  ? t("yourStrategyStatusLoading")
                  : t("yourStrategyStatusIdle")}
          </strong>
          <p>{statusMessage ?? t("yourStrategyStatusIdle")}</p>
        </div>
      </div>

      <div className="action-row">
        <button className="btn secondary" onClick={onReset} type="button">
          {t("yourStrategyResetAction")}
        </button>
        <button className="btn secondary" onClick={onReload} type="button">
          {t("yourStrategyReloadAction")}
        </button>
        <button
          className="btn secondary"
          disabled={controlsDisabled}
          onClick={onSave}
          type="button"
        >
          {t("yourStrategySaveAction")}
        </button>
        <button
          className="btn secondary"
          disabled={resolvedCurrentStep <= 1}
          onClick={() => onStepChange(resolvedCurrentStep - 1)}
          type="button"
        >
          {t("yourStrategyPreviousStepAction")}
        </button>
        <button
          className="btn primary"
          disabled={
            resolvedCurrentStep >= steps.length ||
            (currentStepKey === "market" && !canAdvanceFromStepOne)
          }
          onClick={() => onStepChange(resolvedCurrentStep + 1)}
          type="button"
        >
          {t("yourStrategyNextStepAction")}
        </button>
      </div>
    </div>
  );
}

function IndicatorEditorCard(input: {
  t: TranslationFn;
  indicatorKey: string;
  indicator: PresetIndicatorConfig;
  indicators: Record<string, PresetIndicatorConfig>;
  disabled: boolean;
  onChange: (indicatorKey: string, nextIndicator: PresetIndicatorConfig) => void;
  onRemove: (indicatorKey: string) => void;
}) {
  const { disabled, indicator, indicatorKey, indicators, onChange, onRemove, t } = input;
  const volumeDerived = isVolumeDerivedIndicator(indicator);
  const volumeCompanionKey =
    indicator.type === "volume" ? getVolumeCompanionKey(indicators, indicatorKey) : null;
  const volumeCompanion =
    volumeCompanionKey ? indicators[volumeCompanionKey] : null;
  const volumeMovingAverage =
    volumeCompanion && isVolumeDerivedIndicator(volumeCompanion)
      ? volumeCompanion
      : null;

  function handleTypeChange(nextType: PresetIndicatorConfig["type"]) {
    const nextSource =
      indicator.type === "volume" || volumeDerived ? "volume" : undefined;

    switch (nextType) {
      case "ema":
        onChange(indicatorKey, {
          type: "ema",
          period: 9,
          ...(nextSource ? { source: nextSource } : {}),
        });
        return;
      case "rsi":
        onChange(indicatorKey, { type: "rsi", period: 14 });
        return;
      case "atr":
        onChange(indicatorKey, { type: "atr", period: 14 });
        return;
      case "volume":
        onChange(indicatorKey, { type: "volume" });
        return;
      case "sma":
        onChange(indicatorKey, {
          type: "sma",
          source: nextSource ?? "close",
          period: 20,
        });
        return;
    }
  }

  const indicatorOptions = volumeDerived
    ? [
        { value: "ema", label: "EMA" },
        { value: "sma", label: "SMA" },
      ]
    : indicator.type === "volume"
      ? [
        { value: "volume", label: "Volume" },
        { value: "ema", label: "EMA" },
        { value: "sma", label: "SMA" },
      ]
      : [
          { value: "ema", label: "EMA" },
          { value: "rsi", label: "RSI" },
          { value: "volume", label: "Volume" },
          { value: "sma", label: "SMA" },
        ];

  return (
    <article className="history-card your-strategy-card-block">
      <div>
        <div className="trade-head">
          <strong>{indicatorKey}</strong>
        </div>
        <p>
          {volumeDerived
            ? t("yourStrategyVolumeDerivedIndicatorDescription")
            : t("yourStrategyIndicatorCardDescription")}
        </p>
      </div>
      <div className="form-stack your-strategy-inline-grid">
        {indicator.type === "volume" ? (
          <>
            <label className="onboarding-form__field">
              <span>{t("yourStrategyIndicatorTypeLabel")}</span>
              <select
                className="onboarding-form__input"
                disabled={true}
                value="volume"
              >
                <option value="volume">Volume</option>
              </select>
            </label>

            <label className="onboarding-form__field">
              <span>{t("yourStrategyVolumeMaTypeLabel")}</span>
              <select
                className="onboarding-form__input"
                disabled={disabled}
                onChange={(event) => {
                  if (!volumeCompanionKey) {
                    return;
                  }

                  onChange(volumeCompanionKey, {
                    type: event.target.value as "ema" | "sma",
                    source: "volume",
                    period: getIndicatorPeriod(volumeMovingAverage),
                  });
                }}
                value={volumeMovingAverage?.type ?? "sma"}
              >
                <option value="ema">EMA</option>
                <option value="sma">SMA</option>
              </select>
            </label>

            <label className="onboarding-form__field">
              <span>{t("yourStrategyVolumeMaPeriodLabel")}</span>
              <input
                className="onboarding-form__input"
                disabled={disabled || !volumeCompanionKey || volumeMovingAverage === null}
                min={1}
                onChange={(event) => {
                  if (!volumeCompanionKey || !volumeMovingAverage) {
                    return;
                  }

                  onChange(volumeCompanionKey, {
                    type: volumeMovingAverage.type,
                    source: "volume",
                    period: Number(event.target.value),
                  });
                }}
                type="number"
                value={getIndicatorPeriod(volumeMovingAverage)}
              />
            </label>

            <div className="done-note volume-dependency-note">
              <strong>{t("yourStrategyVolumeDependencyTitle")}</strong>
              <p>{t("yourStrategyVolumeUnifiedDescription")}</p>
            </div>
          </>
        ) : (
          <>
        <label className="onboarding-form__field">
          <span>{t("yourStrategyIndicatorTypeLabel")}</span>
          <select
            className="onboarding-form__input"
            disabled={disabled}
            onChange={(event) =>
              handleTypeChange(event.target.value as PresetIndicatorConfig["type"])
            }
            value={indicator.type}
          >
            {indicatorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {"period" in indicator ? (
          <label className="onboarding-form__field">
            <span>{t("yourStrategyIndicatorPeriodLabel")}</span>
            <input
              className="onboarding-form__input"
              disabled={disabled}
              min={1}
              onChange={(event) =>
                onChange(indicatorKey, {
                  ...indicator,
                  period: Number(event.target.value),
                })
              }
              type="number"
              value={indicator.period}
            />
          </label>
        ) : null}

        {volumeDerived ? (
          <div className="done-note volume-dependency-note">
            <strong>{t("yourStrategyVolumeDependencyTitle")}</strong>
            <p>{t("yourStrategyVolumeDependencyDescription")}</p>
          </div>
        ) : null}
          </>
        )}
      </div>
      <div>
        <button
          className="btn danger small"
          disabled={disabled}
          onClick={() => onRemove(indicatorKey)}
          type="button"
        >
          {t("yourStrategyRemoveIndicatorAction")}
        </button>
      </div>
    </article>
  );
}

function EntrySideWizardSection(input: {
  t: TranslationFn;
  title: string;
  tone: "long" | "short";
  side: YourStrategyDraft["entry"]["long"];
  indicators: Record<string, PresetIndicatorConfig>;
  disabled: boolean;
  onGroupTypeChange: (type: "all" | "any") => void;
  onRuleChange: (
    ruleIndex: number,
    updater: (rule: PresetTriggerRule) => PresetTriggerRule,
  ) => void;
  onAddRule: () => void;
  onRuleRemove: (ruleIndex: number) => void;
}) {
  const {
    disabled,
    indicators,
    onAddRule,
    onGroupTypeChange,
    onRuleChange,
    onRuleRemove,
    side,
    t,
    tone,
    title,
  } = input;

  return (
    <div className="form-stack">
      <div className={`row-between align-start your-strategy-side-header your-strategy-side-header--${tone}`}>
        <div>
          <h4>{title}</h4>
          <p className="subtle">{t("yourStrategyRuleSectionDescription")}</p>
        </div>
        <span className="chip">
          {t("yourStrategyRuleCountBadge").replace(
            "{count}",
            String(side.trigger.rules.length),
          )}
        </span>
      </div>

      <div className="rule-group-card">
        <div className="row-between align-start">
          <div>
            <p className="panel-label">{t("yourStrategyGroupTypeLabel")}</p>
            <h4>
              {side.trigger.type === "all"
                ? t("yourStrategyGroupAllTitle")
                : t("yourStrategyGroupAnyTitle")}
            </h4>
          </div>
          <select
            className="onboarding-form__input wizard-group-select"
            disabled={disabled}
            onChange={(event) =>
              onGroupTypeChange(event.target.value as "all" | "any")
            }
            value={side.trigger.type}
          >
            <option value="all">{t("yourStrategyGroupAllOption")}</option>
            <option value="any">{t("yourStrategyGroupAnyOption")}</option>
          </select>
        </div>

        <div className="history-stack">
          {side.trigger.rules.map((rule, ruleIndex) => (
            <RuleEditorCard
              disabled={disabled}
              indicators={indicators}
              key={`${rule.type}-${ruleIndex}`}
              onChange={(updater) => onRuleChange(ruleIndex, updater)}
              onRemove={() => onRuleRemove(ruleIndex)}
              rule={rule}
              t={t}
            />
          ))}
        </div>

        <div className="action-row">
          <button
            className="btn secondary small"
            disabled={disabled}
            onClick={onAddRule}
            type="button"
          >
            {t("yourStrategyAddRuleAction")}
          </button>
        </div>
      </div>
    </div>
  );
}

function RuleEditorCard(input: {
  t: TranslationFn;
  rule: PresetTriggerRule;
  indicators: Record<string, PresetIndicatorConfig>;
  disabled: boolean;
  onChange: (updater: (rule: PresetTriggerRule) => PresetTriggerRule) => void;
  onRemove: () => void;
}) {
  const { disabled, indicators, onChange, onRemove, rule, t } = input;
  const indicatorKeys = Object.keys(indicators);
  const selectedIndicator = indicators[rule.indicator];
  const selectedContext = selectedIndicator ? getIndicatorContext(selectedIndicator) : "price";
  const priceIndicatorKeys = getPriceIndicatorKeys(indicators);
  const rsiIndicatorKeys = getRsiIndicatorKeys(indicators);
  const volumeIndicatorKeys = getVolumeBaselineKeys(indicators);
  const volumeReferenceKeys = getVolumeReferenceKeys(indicators);
  const availableIndicatorKeys =
    selectedContext === "rsi"
      ? rsiIndicatorKeys
      : selectedContext === "volume"
        ? volumeIndicatorKeys
        : priceIndicatorKeys;
  const thresholdAllowed = selectedContext !== "volume" || volumeReferenceKeys.length > 0;
  const crossAllowed = selectedContext !== "volume";
  const thresholdUsesNumeric = selectedContext === "rsi";
  const crossUsesNumeric = selectedContext === "rsi";
  const referenceKeys =
    selectedContext === "price"
      ? ["PRICE", ...priceIndicatorKeys.filter((indicatorKey) => indicatorKey !== rule.indicator)]
      : selectedContext === "volume"
        ? volumeReferenceKeys
        : [];

  function handleRuleTypeChange(nextType: PresetTriggerRule["type"]) {
    if (nextType === "threshold") {
      const nextIndicatorKey = availableIndicatorKeys[0] ?? indicatorKeys[0] ?? "EMA1";
      onChange(() => createDefaultRuleForIndicator(indicators, nextIndicatorKey));
      return;
    }

    const nextIndicatorKey = availableIndicatorKeys[0] ?? indicatorKeys[0] ?? "EMA1";

    if (selectedContext === "rsi") {
      onChange(() => ({
        scope: "currentCandle",
        type: "cross",
        indicator: nextIndicatorKey,
        operator: "crossesAbove",
        value: 70,
      }));
      return;
    }

    onChange(() => ({
      scope: "currentCandle",
      type: "cross",
      indicator: nextIndicatorKey,
      operator: "crossesAbove",
      ref:
        referenceKeys[0] ??
        (selectedContext === "price" ? "PRICE" : nextIndicatorKey),
    }));
  }

  return (
    <article className="history-card your-strategy-card-block">
      <div className="form-stack your-strategy-inline-grid">
        <label className="onboarding-form__field">
          <span>{t("yourStrategyRuleTypeLabel")}</span>
          <select
            className="onboarding-form__input"
            disabled={disabled}
            onChange={(event) =>
              handleRuleTypeChange(event.target.value as PresetTriggerRule["type"])
            }
            value={rule.type}
          >
            {thresholdAllowed ? (
              <option value="threshold">{t("yourStrategyRuleTypeThreshold")}</option>
            ) : null}
            {crossAllowed ? (
              <option value="cross">{t("yourStrategyRuleTypeCross")}</option>
            ) : null}
          </select>
        </label>

        <label className="onboarding-form__field">
          <span>{t("yourStrategyRuleIndicatorLabel")}</span>
          <select
            className="onboarding-form__input"
            disabled={disabled}
            onChange={(event) =>
              onChange((currentRule) =>
                currentRule.type === "threshold"
                  ? (() => {
                      const nextIndicatorKey = event.target.value;
                      const nextIndicator = indicators[nextIndicatorKey];

                      if (
                        nextIndicator &&
                        getIndicatorContext(nextIndicator) === "volume"
                      ) {
                        const nextReference =
                          getVolumeReferenceKeys(indicators)[0] ?? nextIndicatorKey;

                        return {
                          scope: currentRule.scope,
                          type: "threshold" as const,
                          indicator: nextIndicatorKey,
                          operator: "above" as const,
                          ref: nextReference,
                        };
                      }

                      return {
                        ...currentRule,
                        indicator: nextIndicatorKey,
                      };
                    })()
                  : {
                      ...currentRule,
                      indicator: event.target.value,
                      value: undefined,
                      ref:
                        (getReferenceContext(indicators, event.target.value) === "price"
                          ? ["PRICE", ...getPriceIndicatorKeys(indicators).filter(
                              (indicatorKey) => indicatorKey !== event.target.value,
                            )]
                          : getCompatibleIndicatorKeys(indicators, event.target.value).filter(
                              (indicatorKey) => indicatorKey !== event.target.value,
                            ))[0] ??
                        currentRule.ref ??
                        indicatorKeys[0] ??
                        "EMA1",
                    },
              )
            }
            value={rule.indicator}
          >
            {availableIndicatorKeys.map((indicatorKey) => (
              <option key={indicatorKey} value={indicatorKey}>
                {indicatorKey}
              </option>
            ))}
          </select>
        </label>

        {rule.type === "threshold" ? (
          <>
            {selectedContext === "volume" ? (
              <div className="done-note volume-dependency-note your-strategy-rule-context-note">
                <strong>{t("yourStrategyVolumeRuleHintTitle")}</strong>
                <p>{t("yourStrategyVolumeRuleHintDescription")}</p>
              </div>
            ) : null}
            <label className="onboarding-form__field">
              <span>{t("yourStrategyRuleOperatorLabel")}</span>
              <select
                className="onboarding-form__input"
                disabled={disabled}
                onChange={(event) =>
                  onChange((currentRule) =>
                    currentRule.type === "threshold"
                      ? {
                          ...currentRule,
                          operator: event.target.value as typeof currentRule.operator,
                        }
                      : currentRule,
                  )
                }
                value={rule.operator}
              >
                <option value="above">above</option>
                <option value="atOrAbove">above or equal</option>
                <option value="below">below</option>
                <option value="atOrBelow">below or equal</option>
                <option value="equal">equal</option>
              </select>
            </label>
            {thresholdUsesNumeric ? (
              <label className="onboarding-form__field">
                <span>{t("yourStrategyRuleValueLabel")}</span>
                <input
                  className="onboarding-form__input"
                  disabled={disabled}
                  max={selectedContext === "rsi" ? 100 : undefined}
                  min={selectedContext === "rsi" ? 0 : undefined}
                  onChange={(event) =>
                    onChange((currentRule) => ({
                      ...currentRule,
                      value:
                        selectedContext === "rsi"
                          ? Math.min(100, Math.max(0, Number(event.target.value)))
                          : Number(event.target.value),
                      ref: undefined,
                    }))
                  }
                  type="number"
                  value={rule.value ?? 50}
                />
              </label>
            ) : (
              <label className="onboarding-form__field">
                <span>{t("yourStrategyRuleReferenceLabel")}</span>
                <select
                  className="onboarding-form__input"
                  disabled={disabled}
                  onChange={(event) =>
                    onChange((currentRule) => ({
                      ...currentRule,
                      ref: event.target.value,
                      value: undefined,
                    }))
                  }
                  value={rule.ref ?? referenceKeys[0] ?? ""}
                >
                  {referenceKeys.map((indicatorKey) => (
                    <option key={indicatorKey} value={indicatorKey}>
                      {indicatorKey}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </>
        ) : (
          <>
            {selectedContext === "volume" ? (
              <div className="done-note volume-dependency-note your-strategy-rule-context-note">
                <strong>{t("yourStrategyVolumeRuleHintTitle")}</strong>
                <p>{t("yourStrategyVolumeRuleHintDescription")}</p>
              </div>
            ) : null}
            <label className="onboarding-form__field">
              <span>{t("yourStrategyRuleOperatorLabel")}</span>
              <select
                className="onboarding-form__input"
                disabled={disabled}
                onChange={(event) =>
                  onChange((currentRule) =>
                    currentRule.type === "cross"
                      ? {
                          ...currentRule,
                          operator: event.target.value as typeof currentRule.operator,
                        }
                      : currentRule,
                  )
                }
                value={rule.operator}
              >
                <option value="crossesAbove">crosses above</option>
                <option value="crossesBelow">crosses below</option>
              </select>
            </label>
            {crossUsesNumeric ? (
              <label className="onboarding-form__field">
                <span>{t("yourStrategyRuleValueLabel")}</span>
                <input
                  className="onboarding-form__input"
                  disabled={disabled}
                  max={100}
                  min={0}
                  onChange={(event) =>
                    onChange((currentRule) => ({
                      ...currentRule,
                      value: Math.min(100, Math.max(0, Number(event.target.value))),
                      ref: undefined,
                    }))
                  }
                  type="number"
                  value={rule.value ?? 70}
                />
              </label>
            ) : (
              <label className="onboarding-form__field">
                <span>{t("yourStrategyRuleReferenceLabel")}</span>
                <select
                  className="onboarding-form__input"
                  disabled={disabled}
                  onChange={(event) =>
                    onChange((currentRule) => ({
                      ...currentRule,
                      ref: event.target.value,
                      value: undefined,
                    }))
                  }
                  value={rule.ref ?? referenceKeys[0] ?? ""}
                >
                  {referenceKeys.map((indicatorKey) => (
                    <option key={indicatorKey} value={indicatorKey}>
                      {indicatorKey}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}
      </div>

      <div>
        <button
          className="btn danger small"
          disabled={disabled}
          onClick={onRemove}
          type="button"
        >
          {t("yourStrategyRemoveRuleAction")}
        </button>
      </div>
    </article>
  );
}

function formatBacktestPeriodLabel(
  backtestPreview:
    | PresetBacktestPreviewSuccess
    | YourStrategyBacktestPreviewSuccess
    | null,
) {
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
