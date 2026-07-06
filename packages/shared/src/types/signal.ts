export type Signal = "none" | "long" | "short";

export type TriggerScope = "previousCandle" | "currentCandle";

export type ThresholdOperator =
  | "above"
  | "below"
  | "atOrAbove"
  | "atOrBelow"
  | "equal";

export type CrossOperator = "crossesAbove" | "crossesBelow";

export type TriggerGroupType = "all" | "any";

export interface IndicatorEmaConfig {
  type: "ema";
  period: number;
  source?: string;
}

export interface IndicatorRsiConfig {
  type: "rsi";
  period: number;
}

export interface IndicatorAtrConfig {
  type: "atr";
  period: number;
}

export interface IndicatorVolumeConfig {
  type: "volume";
}

export interface IndicatorSmaConfig {
  type: "sma";
  source: string;
  period: number;
}

/**
 * Donchian channel over the PREVIOUS `period` candles (current candle
 * excluded) so breakout cross rules can actually fire.
 */
export interface IndicatorDonchianConfig {
  type: "donchian";
  period: number;
  band: "upper" | "lower" | "middle";
}

/** Wilder's Average Directional Index (0-100 trend-strength oscillator). */
export interface IndicatorAdxConfig {
  type: "adx";
  period: number;
}

export type IndicatorConfig =
  | IndicatorEmaConfig
  | IndicatorRsiConfig
  | IndicatorAtrConfig
  | IndicatorVolumeConfig
  | IndicatorSmaConfig
  | IndicatorDonchianConfig
  | IndicatorAdxConfig;

export interface ThresholdValueRule {
  scope: TriggerScope;
  type: "threshold";
  indicator: string;
  operator: ThresholdOperator;
  value: number;
  ref?: undefined;
}

export interface ThresholdReferenceRule {
  scope: TriggerScope;
  type: "threshold";
  indicator: string;
  operator: ThresholdOperator;
  ref: string;
  value?: undefined;
}

export interface CrossReferenceRule {
  scope: TriggerScope;
  type: "cross";
  indicator: string;
  operator: CrossOperator;
  ref: string;
  value?: undefined;
}

export interface CrossValueRule {
  scope: TriggerScope;
  type: "cross";
  indicator: string;
  operator: CrossOperator;
  value: number;
  ref?: undefined;
}

export type TriggerRule =
  | ThresholdValueRule
  | ThresholdReferenceRule
  | CrossReferenceRule
  | CrossValueRule;

export interface TriggerGroup {
  type: TriggerGroupType;
  rules: TriggerRule[];
}

export interface EntrySide {
  enabled: boolean;
  trigger: TriggerGroup;
}

export interface StopLossStaticConfig {
  mode: "static";
  value: number;
  unit: "percent";
}

export interface StopLossAtrConfig {
  mode: "atr";
  period: number;
  multiplier: number;
}

export type StopLossConfig = StopLossStaticConfig | StopLossAtrConfig;

export interface TakeProfitRrConfig {
  mode: "rr";
  multiple: number;
}

export type TakeProfitConfig = TakeProfitRrConfig;

export interface StrategyConfig {
  name: string;
  version: number;
  timeframe: string;
  symbol: string;
  indicators: Record<string, IndicatorConfig>;
  entry: {
    long: EntrySide;
    short: EntrySide;
  };
  risk: {
    stopLoss: StopLossConfig;
    takeProfit: TakeProfitConfig;
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
}
