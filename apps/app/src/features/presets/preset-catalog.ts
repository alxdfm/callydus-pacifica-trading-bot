import type {
  PresetActivation,
  PresetDefinition,
  PresetEditableConfig,
} from "@pacifica/contracts";
import type { MessageKey } from "../../shared/i18n/messages";

export type PresetRiskTone = "success" | "warning" | "danger";

type TranslationFn = (key: MessageKey) => string;

type PresetTechnicalContract = {
  timeframe: string;
  symbol: string;
  indicators: Record<string, Record<string, number | string>>;
  entry: {
    long: {
      enabled: boolean;
      trigger: {
        type: "all";
        rules: Array<Record<string, number | string>>;
      };
    };
    short: {
      enabled: boolean;
      trigger: {
        type: "all";
        rules: Array<Record<string, number | string>>;
      };
    };
  };
  risk: {
    stopLoss: Record<string, number | string>;
    takeProfit: Record<string, number | string>;
  };
  execution: {
    positionSize: {
      type: "fixedPercent";
      value: number;
    };
    onePositionPerSymbol: boolean;
    manualCloseAllowed: boolean;
    closeOppositePositionOnSignal: boolean;
  };
};

type PresetCatalogRawItem = {
  definition: {
    id: string;
    name: PresetDefinition["name"];
    slug: PresetDefinition["slug"];
    version: number;
    isActive: boolean;
    riskLabelKey: MessageKey;
    frequencyLabelKey: MessageKey;
    descriptionKey: MessageKey;
  };
  prioritiesKeys: [MessageKey, MessageKey];
  triggerDetailsKeys: {
    buy: MessageKey;
    sell: MessageKey;
    stopLoss: MessageKey;
    takeProfit: MessageKey;
  };
  reviewSummaryKey: MessageKey;
  activationSummaryKey: MessageKey;
  riskTone: PresetRiskTone;
  technicalContract: PresetTechnicalContract;
};

export type PresetCatalogItem = {
  definition: PresetDefinition;
  timeframeLabel: string;
  priorities: string[];
  triggerDetails: {
    buy: string;
    sell: string;
    stopLoss: string;
    takeProfit: string;
  };
  reviewSummary: string;
  activationSummary: (config: PresetEditableConfig) => string;
  riskTone: PresetRiskTone;
  defaultEditableConfig: PresetEditableConfig;
  technicalContract: PresetTechnicalContract;
};

const presetCatalogRaw: PresetCatalogRawItem[] = [
  {
    definition: {
      id: "2d5a5641-c7ad-4ff0-9f75-4fbcb58a4d01",
      name: "Safer",
      slug: "safer",
      version: 1,
      isActive: true,
      riskLabelKey: "presetSaferRiskLabel",
      frequencyLabelKey: "presetSaferFrequencyLabel",
      descriptionKey: "presetSaferDescription",
    },
    prioritiesKeys: ["presetSaferPriorityOne", "presetSaferPriorityTwo"],
    triggerDetailsKeys: {
      buy: "presetSaferTriggerBuy",
      sell: "presetSaferTriggerSell",
      stopLoss: "presetSaferTriggerStopLoss",
      takeProfit: "presetSaferTriggerTakeProfit",
    },
    reviewSummaryKey: "presetSaferReviewSummary",
    activationSummaryKey: "presetSaferActivationSummary",
    riskTone: "success",
    technicalContract: {
      timeframe: "15m",
      symbol: "BTC/USDC",
      indicators: {
        emaFast: { type: "ema", period: 12 },
        emaSlow: { type: "ema", period: 24 },
        rsi: { type: "rsi", period: 14 },
        atr: { type: "atr", period: 14 },
        volume: { type: "volume" },
        volumeSma: { type: "sma", source: "volume", period: 20 },
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
                indicator: "emaFast",
                operator: "crossesAbove",
                ref: "emaSlow",
              },
              {
                scope: "currentCandle",
                type: "threshold",
                indicator: "rsi",
                operator: "below",
                value: 30,
              },
            ],
          },
        },
        short: {
          enabled: true,
          trigger: {
            type: "all",
            rules: [
              {
                scope: "currentCandle",
                type: "cross",
                indicator: "emaFast",
                operator: "crossesBelow",
                ref: "emaSlow",
              },
              {
                scope: "currentCandle",
                type: "threshold",
                indicator: "rsi",
                operator: "above",
                value: 70,
              },
            ],
          },
        },
      },
      risk: {
        stopLoss: { mode: "atr", period: 14, multiplier: 1.5 },
        takeProfit: { mode: "rr", multiple: 2 },
      },
      execution: {
        positionSize: { type: "fixedPercent", value: 3 },
        onePositionPerSymbol: true,
        manualCloseAllowed: true,
        closeOppositePositionOnSignal: false,
      },
    },
  },
  {
    definition: {
      id: "54663f73-b1e9-4384-9057-48d68ba689b2",
      name: "Balanced",
      slug: "balanced",
      version: 1,
      isActive: true,
      riskLabelKey: "presetBalancedRiskLabel",
      frequencyLabelKey: "presetBalancedFrequencyLabel",
      descriptionKey: "presetBalancedDescription",
    },
    prioritiesKeys: ["presetBalancedPriorityOne", "presetBalancedPriorityTwo"],
    triggerDetailsKeys: {
      buy: "presetBalancedTriggerBuy",
      sell: "presetBalancedTriggerSell",
      stopLoss: "presetBalancedTriggerStopLoss",
      takeProfit: "presetBalancedTriggerTakeProfit",
    },
    reviewSummaryKey: "presetBalancedReviewSummary",
    activationSummaryKey: "presetBalancedActivationSummary",
    riskTone: "warning",
    technicalContract: {
      timeframe: "15m",
      symbol: "BTC/USDC",
      indicators: {
        emaFast: { type: "ema", period: 8 },
        emaSlow: { type: "ema", period: 21 },
        rsi: { type: "rsi", period: 14 },
        atr: { type: "atr", period: 14 },
        volume: { type: "volume" },
        volumeSma: { type: "sma", source: "volume", period: 20 },
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
                indicator: "emaFast",
                operator: "crossesAbove",
                ref: "emaSlow",
              },
              {
                scope: "currentCandle",
                type: "threshold",
                indicator: "rsi",
                operator: "atOrAbove",
                value: 50,
              },
              {
                scope: "currentCandle",
                type: "cross",
                indicator: "volume",
                operator: "crossesAbove",
                ref: "volumeSma",
              },
            ],
          },
        },
        short: {
          enabled: true,
          trigger: {
            type: "all",
            rules: [
              {
                scope: "currentCandle",
                type: "cross",
                indicator: "emaFast",
                operator: "crossesBelow",
                ref: "emaSlow",
              },
              {
                scope: "currentCandle",
                type: "threshold",
                indicator: "rsi",
                operator: "atOrBelow",
                value: 50,
              },
              {
                scope: "currentCandle",
                type: "cross",
                indicator: "volume",
                operator: "crossesAbove",
                ref: "volumeSma",
              },
            ],
          },
        },
      },
      risk: {
        stopLoss: { mode: "static", value: 1.2, unit: "percent" },
        takeProfit: { mode: "rr", multiple: 2 },
      },
      execution: {
        positionSize: { type: "fixedPercent", value: 5 },
        onePositionPerSymbol: true,
        manualCloseAllowed: true,
        closeOppositePositionOnSignal: false,
      },
    },
  },
  {
    definition: {
      id: "1242f0f9-7a5b-44ea-b32d-368ceba95a93",
      name: "More active",
      slug: "more-active",
      version: 1,
      isActive: true,
      riskLabelKey: "presetMoreActiveRiskLabel",
      frequencyLabelKey: "presetMoreActiveFrequencyLabel",
      descriptionKey: "presetMoreActiveDescription",
    },
    prioritiesKeys: ["presetMoreActivePriorityOne", "presetMoreActivePriorityTwo"],
    triggerDetailsKeys: {
      buy: "presetMoreActiveTriggerBuy",
      sell: "presetMoreActiveTriggerSell",
      stopLoss: "presetMoreActiveTriggerStopLoss",
      takeProfit: "presetMoreActiveTriggerTakeProfit",
    },
    reviewSummaryKey: "presetMoreActiveReviewSummary",
    activationSummaryKey: "presetMoreActiveActivationSummary",
    riskTone: "danger",
    technicalContract: {
      timeframe: "5m",
      symbol: "BTC/USDC",
      indicators: {
        emaFast: { type: "ema", period: 9 },
        emaSlow: { type: "ema", period: 18 },
        rsi: { type: "rsi", period: 14 },
        atr: { type: "atr", period: 14 },
        volume: { type: "volume" },
        volumeSma: { type: "sma", source: "volume", period: 20 },
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
                indicator: "volume",
                operator: "crossesAbove",
                ref: "volumeSma",
              },
              {
                scope: "currentCandle",
                type: "cross",
                indicator: "emaFast",
                operator: "crossesAbove",
                ref: "emaSlow",
              },
              {
                scope: "currentCandle",
                type: "threshold",
                indicator: "rsi",
                operator: "atOrAbove",
                value: 45,
              },
            ],
          },
        },
        short: {
          enabled: true,
          trigger: {
            type: "all",
            rules: [
              {
                scope: "currentCandle",
                type: "cross",
                indicator: "volume",
                operator: "crossesAbove",
                ref: "volumeSma",
              },
              {
                scope: "currentCandle",
                type: "cross",
                indicator: "emaFast",
                operator: "crossesBelow",
                ref: "emaSlow",
              },
              {
                scope: "currentCandle",
                type: "threshold",
                indicator: "rsi",
                operator: "atOrBelow",
                value: 55,
              },
            ],
          },
        },
      },
      risk: {
        stopLoss: { mode: "static", value: 1.0, unit: "percent" },
        takeProfit: { mode: "rr", multiple: 1.6 },
      },
      execution: {
        positionSize: { type: "fixedPercent", value: 5 },
        onePositionPerSymbol: true,
        manualCloseAllowed: true,
        closeOppositePositionOnSignal: false,
      },
    },
  },
];

function interpolate(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, value),
    template,
  );
}

function formatPositionSize(value: number) {
  return `${value}%`;
}

function formatDirection(
  enabled: boolean,
  label: "long" | "short",
  t: TranslationFn,
) {
  if (label === "long") {
    return enabled ? t("presetLongEnabled") : t("presetLongDisabled");
  }

  return enabled ? t("presetShortEnabled") : t("presetShortDisabled");
}

function translatePreset(
  item: PresetCatalogRawItem,
  t: TranslationFn,
): PresetCatalogItem {
  return {
    definition: {
      id: item.definition.id,
      name: item.definition.name,
      slug: item.definition.slug,
      version: item.definition.version,
      riskLabel: t(item.definition.riskLabelKey),
      frequencyLabel: t(item.definition.frequencyLabelKey),
      description: t(item.definition.descriptionKey),
      isActive: item.definition.isActive,
    },
    timeframeLabel: item.technicalContract.timeframe,
    priorities: item.prioritiesKeys.map((key) => t(key)),
    triggerDetails: {
      buy: t(item.triggerDetailsKeys.buy),
      sell: t(item.triggerDetailsKeys.sell),
      stopLoss: t(item.triggerDetailsKeys.stopLoss),
      takeProfit: t(item.triggerDetailsKeys.takeProfit),
    },
    reviewSummary: t(item.reviewSummaryKey),
    activationSummary: (config) =>
      interpolate(t(item.activationSummaryKey), {
        symbol: config.symbol,
        size: formatPositionSize(config.positionSizeValue),
        longState: formatDirection(config.longEnabled, "long", t),
        shortState: formatDirection(config.shortEnabled, "short", t),
      }),
    riskTone: item.riskTone,
    defaultEditableConfig: {
      symbol: item.technicalContract.symbol,
      positionSizeType: "balance_percent",
      positionSizeValue: item.technicalContract.execution.positionSize.value,
      longEnabled: item.technicalContract.entry.long.enabled,
      shortEnabled: item.technicalContract.entry.short.enabled,
    } satisfies PresetEditableConfig,
    technicalContract: item.technicalContract,
  };
}

function getPresetCatalogRawItemByDefinitionId(
  presetDefinitionId: string | null | undefined,
) {
  if (!presetDefinitionId) {
    return null;
  }

  return presetCatalogRaw.find((item) => item.definition.id === presetDefinitionId) ?? null;
}

export function getPresetCatalog(t: TranslationFn) {
  return presetCatalogRaw.map((item) => translatePreset(item, t));
}

export function getPresetCatalogItemByDefinitionId(
  presetDefinitionId: string | null | undefined,
  t: TranslationFn,
) {
  const rawItem = getPresetCatalogRawItemByDefinitionId(presetDefinitionId);

  return rawItem ? translatePreset(rawItem, t) : null;
}

export function getEditableConfigForPreset(
  presetDefinitionId: string,
  activePreset: PresetActivation | null,
) {
  const preset = getPresetCatalogRawItemByDefinitionId(presetDefinitionId);

  if (!preset) {
    return null;
  }

  if (activePreset?.presetDefinitionId === presetDefinitionId) {
    return activePreset.editableConfig;
  }

  return {
    symbol: preset.technicalContract.symbol,
    positionSizeType: "balance_percent",
    positionSizeValue: preset.technicalContract.execution.positionSize.value,
    longEnabled: preset.technicalContract.entry.long.enabled,
    shortEnabled: preset.technicalContract.entry.short.enabled,
  } satisfies PresetEditableConfig;
}

export function getPresetTechnicalContractByDefinitionId(
  presetDefinitionId: string | null | undefined,
) {
  return getPresetCatalogRawItemByDefinitionId(presetDefinitionId)?.technicalContract ?? null;
}

export const allowedPresetSymbols = ["BTC/USDC", "ETH/USDC", "SOL/USDC", "ARB/USDC"] as const;
