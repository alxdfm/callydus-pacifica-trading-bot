import { describe, expect, it } from "vitest";
import {
  BALANCED_PRESET_DEFINITION_ID,
  MORE_ACTIVE_PRESET_DEFINITION_ID,
  SAFER_PRESET_DEFINITION_ID,
} from "@pacifica/contracts";
import {
  allowedPresetSymbols,
  getEditableConfigForPreset,
  getPresetCatalog,
  getPresetCatalogItemByDefinitionId,
  getPresetTechnicalContractByDefinitionId,
} from "./preset-catalog";

const t = (key: string) => {
  if (key === "presetMoreActiveActivationSummary") {
    return "{symbol} {size} {longState} {shortState}";
  }

  return key;
};

describe("preset-catalog", () => {
  it("expõe os 3 presets oficiais do MVP", () => {
    const catalog = getPresetCatalog(t);

    expect(catalog.map((item) => item.definition.id)).toEqual([
      SAFER_PRESET_DEFINITION_ID,
      BALANCED_PRESET_DEFINITION_ID,
      MORE_ACTIVE_PRESET_DEFINITION_ID,
    ]);
  });

  it("reaproveita a configuração editável do preset ativo quando ele coincide", () => {
    const activePreset = {
      presetDefinitionId: SAFER_PRESET_DEFINITION_ID,
      editableConfig: {
        symbol: "SOL/USDC",
        positionSizeType: "balance_percent" as const,
        positionSizeValue: 12,
        longEnabled: false,
        shortEnabled: true,
      },
    };

    expect(
      getEditableConfigForPreset(SAFER_PRESET_DEFINITION_ID, activePreset as never),
    ).toEqual(activePreset.editableConfig);
  });

  it("usa o contrato técnico canônico como fallback para defaults", () => {
    const config = getEditableConfigForPreset(BALANCED_PRESET_DEFINITION_ID, null);
    const contract = getPresetTechnicalContractByDefinitionId(
      BALANCED_PRESET_DEFINITION_ID,
    );

    expect(config?.symbol).toBe(contract?.symbol);
    expect(config?.positionSizeValue).toBe(contract?.execution.positionSize.value);
  });

  it("gera resumo de ativação com símbolo, tamanho e lados habilitados", () => {
    const item = getPresetCatalogItemByDefinitionId(
      MORE_ACTIVE_PRESET_DEFINITION_ID,
      t,
    );

    expect(
      item?.activationSummary({
        symbol: "BTC/USDC",
        positionSizeType: "balance_percent",
        positionSizeValue: 5,
        longEnabled: true,
        shortEnabled: false,
      }),
    ).toContain("BTC/USDC");
  });

  it("expõe a whitelist de símbolos editáveis do produto", () => {
    expect(allowedPresetSymbols).toEqual([
      "BTC/USDC",
      "ETH/USDC",
      "SOL/USDC",
    ]);
  });
});
