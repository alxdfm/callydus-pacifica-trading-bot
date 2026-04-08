import type {
  PresetTechnicalContract,
  PresetActivation,
  PresetDefinition,
  PresetEditableConfig,
  PresetSymbol,
} from "@pacifica/contracts";
import {
  BALANCED_PRESET_DEFINITION_ID,
  MORE_ACTIVE_PRESET_DEFINITION_ID,
  SAFER_PRESET_DEFINITION_ID,
  getPresetTechnicalContractByDefinitionId as getSharedPresetTechnicalContractByDefinitionId,
} from "@pacifica/contracts";
import type { MessageKey } from "../../shared/i18n/messages";

type PresetRiskTone = "success" | "warning" | "danger";

type TranslationFn = (key: MessageKey) => string;

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

type PresetCatalogItem = {
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
      id: SAFER_PRESET_DEFINITION_ID,
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
    technicalContract:
      getSharedPresetTechnicalContractByDefinitionId(SAFER_PRESET_DEFINITION_ID)!,
  },
  {
    definition: {
      id: BALANCED_PRESET_DEFINITION_ID,
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
    technicalContract:
      getSharedPresetTechnicalContractByDefinitionId(BALANCED_PRESET_DEFINITION_ID)!,
  },
  {
    definition: {
      id: MORE_ACTIVE_PRESET_DEFINITION_ID,
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
    technicalContract:
      getSharedPresetTechnicalContractByDefinitionId(MORE_ACTIVE_PRESET_DEFINITION_ID)!,
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
  const symbol = toPresetSymbol(item.technicalContract.symbol);

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
      symbol,
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
    symbol: toPresetSymbol(preset.technicalContract.symbol),
    positionSizeType: "balance_percent",
    positionSizeValue: preset.technicalContract.execution.positionSize.value,
    longEnabled: preset.technicalContract.entry.long.enabled,
    shortEnabled: preset.technicalContract.entry.short.enabled,
  } satisfies PresetEditableConfig;
}

export function getPresetTechnicalContractByDefinitionId(
  presetDefinitionId: string | null | undefined,
) {
  return (
    getSharedPresetTechnicalContractByDefinitionId(presetDefinitionId) ??
    getPresetCatalogRawItemByDefinitionId(presetDefinitionId)?.technicalContract ??
    null
  );
}

export const allowedPresetSymbols = ["BTC/USDC", "ETH/USDC", "SOL/USDC"] as const;

function toPresetSymbol(value: string): PresetSymbol {
  if (value === "BTC/USDC" || value === "ETH/USDC" || value === "SOL/USDC") {
    return value;
  }

  throw new Error(`Unsupported preset symbol: ${value}`);
}
