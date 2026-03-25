import type {
  PresetActivation,
  PresetDefinition,
  PresetEditableConfig,
} from "@pacifica/contracts";

export type PresetRiskTone = "success" | "warning" | "danger";

export type PresetCatalogItem = {
  definition: PresetDefinition;
  timeframeLabel: string;
  focusLabel: string;
  priorities: string[];
  triggerDetails: {
    buy: string;
    sell: string;
    stopLoss: string;
    takeProfit: string;
  };
  comparison: {
    risk: string;
    frequency: string;
    style: string;
    stop: string;
    takeProfit: string;
  };
  reviewSummary: string;
  activationSummary: (config: PresetEditableConfig) => string;
  riskTone: PresetRiskTone;
  defaultEditableConfig: PresetEditableConfig;
};

const presetCatalog: PresetCatalogItem[] = [
  {
    definition: {
      id: "2d5a5641-c7ad-4ff0-9f75-4fbcb58a4d01",
      name: "Safer",
      slug: "safer",
      version: 1,
      riskLabel: "Low risk",
      frequencyLabel: "Low frequency",
      description: "Lower activity and stronger protection.",
      isActive: true,
    },
    timeframeLabel: "15m",
    focusLabel: "Protection and selectivity",
    priorities: ["Selective entries", "Stronger protection"],
    triggerDetails: {
      buy: "Buys after stronger confirmation and fewer entry signals.",
      sell: "Sells only when the same confirmation weakens or reverses.",
      stopLoss: "Uses an ATR-based stop to adapt to volatility.",
      takeProfit: "Targets a 2.0 risk-reward ratio before closing.",
    },
    comparison: {
      risk: "Lower",
      frequency: "Smaller",
      style: "Selective",
      stop: "ATR-based",
      takeProfit: "RR 2.0",
    },
    reviewSummary: "A more selective operating mode with fewer entries and stronger protection.",
    activationSummary: (config) =>
      `Safer on ${config.symbol} with size ${formatPositionSize(config.positionSizeValue)}, ${formatDirection(config.longEnabled, "long")} and ${formatDirection(config.shortEnabled, "short")}.`,
    riskTone: "success",
    defaultEditableConfig: {
      symbol: "BTC/USDC",
      positionSizeType: "balance_percent",
      positionSizeValue: 3,
      longEnabled: true,
      shortEnabled: true,
    },
  },
  {
    definition: {
      id: "54663f73-b1e9-4384-9057-48d68ba689b2",
      name: "Balanced",
      slug: "balanced",
      version: 1,
      riskLabel: "Medium risk",
      frequencyLabel: "Medium frequency",
      description: "Best default for the MVP with controlled exposure.",
      isActive: true,
    },
    timeframeLabel: "15m",
    focusLabel: "Controlled opportunity",
    priorities: ["Moderate activity", "Controlled entries"],
    triggerDetails: {
      buy: "Buys after balanced confirmation from the default entry filters.",
      sell: "Sells when momentum fades or the setup invalidates.",
      stopLoss: "Uses a static 1.2% stop for consistent protection.",
      takeProfit: "Targets a 2.0 risk-reward ratio before closing.",
    },
    comparison: {
      risk: "Medium",
      frequency: "Moderate",
      style: "Controlled",
      stop: "Static 1.2%",
      takeProfit: "RR 2.0",
    },
    reviewSummary: "A balanced operating mode with moderate activity and controlled entries.",
    activationSummary: (config) =>
      `Balanced on ${config.symbol} with size ${formatPositionSize(config.positionSizeValue)}, ${formatDirection(config.longEnabled, "long")} and ${formatDirection(config.shortEnabled, "short")}.`,
    riskTone: "warning",
    defaultEditableConfig: {
      symbol: "BTC/USDC",
      positionSizeType: "balance_percent",
      positionSizeValue: 5,
      longEnabled: true,
      shortEnabled: false,
    },
  },
  {
    definition: {
      id: "1242f0f9-7a5b-44ea-b32d-368ceba95a93",
      name: "More active",
      slug: "more-active",
      version: 1,
      riskLabel: "Higher activity",
      frequencyLabel: "Higher frequency",
      description: "More opportunities with looser selection rules.",
      isActive: true,
    },
    timeframeLabel: "5m",
    focusLabel: "More opportunities",
    priorities: ["Looser filters", "Higher recurrence"],
    triggerDetails: {
      buy: "Buys on looser confirmation to capture more opportunities.",
      sell: "Sells faster when short-term momentum weakens.",
      stopLoss: "Uses a tighter static 1.0% stop to keep risk bounded.",
      takeProfit: "Targets a 1.6 risk-reward ratio for faster exits.",
    },
    comparison: {
      risk: "Medium",
      frequency: "Higher",
      style: "Opportunistic",
      stop: "Static 1.0%",
      takeProfit: "RR 1.6",
    },
    reviewSummary: "A more active operating mode with looser rules and more opportunities.",
    activationSummary: (config) =>
      `More active on ${config.symbol} with size ${formatPositionSize(config.positionSizeValue)}, ${formatDirection(config.longEnabled, "long")} and ${formatDirection(config.shortEnabled, "short")}.`,
    riskTone: "danger",
    defaultEditableConfig: {
      symbol: "BTC/USDC",
      positionSizeType: "balance_percent",
      positionSizeValue: 5,
      longEnabled: true,
      shortEnabled: true,
    },
  },
];

function formatPositionSize(value: number) {
  return `${value}%`;
}

function formatDirection(enabled: boolean, label: string) {
  return enabled ? `${label} enabled` : `${label} disabled`;
}

export function getPresetCatalog() {
  return presetCatalog;
}

export function getPresetCatalogItemByDefinitionId(presetDefinitionId: string | null | undefined) {
  if (!presetDefinitionId) {
    return null;
  }

  return presetCatalog.find((item) => item.definition.id === presetDefinitionId) ?? null;
}

export function getEditableConfigForPreset(
  presetDefinitionId: string,
  activePreset: PresetActivation | null,
) {
  const preset = getPresetCatalogItemByDefinitionId(presetDefinitionId);

  if (!preset) {
    return null;
  }

  if (activePreset?.presetDefinitionId === presetDefinitionId) {
    return activePreset.editableConfig;
  }

  return preset.defaultEditableConfig;
}

export const allowedPresetSymbols = ["BTC/USDC", "ETH/USDC", "SOL/USDC", "ARB/USDC"] as const;
