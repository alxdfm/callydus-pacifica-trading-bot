import type { StrategyDraft, TriggerRule } from "@pacifica/shared/contracts";

// ---------------------------------------------------------------------------
// Validação SEMÂNTICA do draft (regra ↔ indicador), portada do superRefine do
// contrato v1. O schema compartilhado valida só a forma do wire — a coerência
// das regras é responsabilidade do builder (aqui) e do materialize no server.
// ---------------------------------------------------------------------------

export type DraftIssue = {
  path: string;
  message: string;
};

type IndicatorContext = "price" | "rsi" | "adx" | "volume" | "atr" | "unknown";

function resolveIndicatorContext(
  draft: StrategyDraft,
  indicatorKey: string,
): IndicatorContext {
  const indicator = draft.indicators[indicatorKey];

  if (!indicator) return "unknown";
  if (indicator.type === "rsi") return "rsi";
  if (indicator.type === "adx") return "adx";
  // bandas do donchian vivem no gráfico de preço — comparáveis a PRICE/EMA/SMA
  if (indicator.type === "donchian") return "price";
  if (indicator.type === "atr") return "atr";
  if (indicator.type === "volume") return "volume";

  if (indicator.type === "ema" || indicator.type === "sma") {
    if (!indicator.source || indicator.source === "price") {
      return "price";
    }

    const sourceIndicator = draft.indicators[indicator.source];
    if (sourceIndicator?.type === "volume") {
      return "volume";
    }
  }

  return "unknown";
}

function validatePriceRule(
  draft: StrategyDraft,
  rule: TriggerRule,
  path: string,
  issues: DraftIssue[],
) {
  if (rule.value !== undefined) {
    issues.push({
      path: `${path}.value`,
      message:
        "Price indicators must compare against PRICE or another price indicator.",
    });
  }

  if (!rule.ref) {
    issues.push({
      path: `${path}.ref`,
      message:
        "Price indicators must reference PRICE or another EMA/SMA indicator.",
    });
    return;
  }

  if (rule.ref === "PRICE") return;

  const refContext = resolveIndicatorContext(draft, rule.ref);
  if (refContext !== "price") {
    issues.push({
      path: `${path}.ref`,
      message:
        "Price indicators can only reference PRICE, EMA or SMA on the price chart.",
    });
  }
}

function validateOscillatorRule(
  rule: TriggerRule,
  path: string,
  issues: DraftIssue[],
  label: "RSI" | "ADX",
) {
  if (rule.ref !== undefined) {
    issues.push({
      path: `${path}.ref`,
      message: `${label} rules must use a numeric level between 0 and 100.`,
    });
  }

  if (rule.value === undefined) {
    issues.push({
      path: `${path}.value`,
      message: `${label} rules must define a numeric level between 0 and 100.`,
    });
    return;
  }

  if (rule.value < 0 || rule.value > 100) {
    issues.push({
      path: `${path}.value`,
      message: `${label} values must stay between 0 and 100.`,
    });
  }
}

function validateVolumeRule(
  draft: StrategyDraft,
  rule: TriggerRule,
  path: string,
  issues: DraftIssue[],
) {
  if (rule.type !== "threshold") {
    issues.push({
      path: `${path}.type`,
      message:
        "Volume can only be used as a threshold confirmation against its own moving average.",
    });
  }

  if (rule.value !== undefined) {
    issues.push({
      path: `${path}.value`,
      message:
        "Volume confirmation must compare current volume against its own moving average.",
    });
  }

  if (!rule.ref || rule.ref === "PRICE") {
    issues.push({
      path: `${path}.ref`,
      message:
        "Volume confirmation must reference a SMA/EMA derived from the same volume indicator.",
    });
    return;
  }

  const refIndicator = draft.indicators[rule.ref];
  if (!refIndicator) return;

  const isVolumeAverage =
    (refIndicator.type === "sma" || refIndicator.type === "ema") &&
    refIndicator.source === rule.indicator;

  if (!isVolumeAverage) {
    issues.push({
      path: `${path}.ref`,
      message:
        "Volume can only reference a SMA/EMA derived from the same volume indicator.",
    });
  }
}

function validateSide(
  draft: StrategyDraft,
  side: "long" | "short",
  issues: DraftIssue[],
) {
  const rules = draft.entry[side].trigger.rules;

  for (const [ruleIndex, rule] of rules.entries()) {
    const path = `entry.${side}.trigger.rules.${ruleIndex}`;
    const indicator = draft.indicators[rule.indicator];

    if (!indicator) {
      issues.push({
        path: `${path}.indicator`,
        message: `Indicator "${rule.indicator}" is not defined in this strategy.`,
      });
      continue;
    }

    const indicatorContext = resolveIndicatorContext(draft, rule.indicator);

    if (indicatorContext === "atr") {
      issues.push({
        path: `${path}.indicator`,
        message: "ATR can only be used for stop loss, not for entry rules.",
      });
      continue;
    }

    if (indicatorContext === "unknown") {
      issues.push({
        path: `${path}.indicator`,
        message: `Indicator "${rule.indicator}" uses an unsupported source context.`,
      });
      continue;
    }

    if (rule.ref === "PRICE" && indicatorContext !== "price") {
      issues.push({
        path: `${path}.ref`,
        message: "Only price indicators can reference PRICE.",
      });
    }

    if (rule.ref && rule.ref !== "PRICE" && !draft.indicators[rule.ref]) {
      issues.push({
        path: `${path}.ref`,
        message: `Reference indicator "${rule.ref}" is not defined in this strategy.`,
      });
      continue;
    }

    switch (indicatorContext) {
      case "price":
        validatePriceRule(draft, rule, path, issues);
        break;
      case "rsi":
        validateOscillatorRule(rule, path, issues, "RSI");
        break;
      case "adx":
        validateOscillatorRule(rule, path, issues, "ADX");
        break;
      case "volume":
        validateVolumeRule(draft, rule, path, issues);
        break;
    }
  }
}

export function validateDraftSemantics(draft: StrategyDraft): DraftIssue[] {
  const issues: DraftIssue[] = [];
  validateSide(draft, "long", issues);
  validateSide(draft, "short", issues);
  return issues;
}
