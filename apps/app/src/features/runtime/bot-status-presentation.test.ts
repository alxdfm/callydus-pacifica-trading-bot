import { describe, expect, it } from "vitest";
import { getBotStatusPresentation } from "./bot-status-presentation";

const t = (key: string) => key;

describe("getBotStatusPresentation", () => {
  it("mapeia active para ação de pause", () => {
    expect(getBotStatusPresentation("active", t)).toEqual({
      badgeTone: "warning",
      badgeLabel: "botStatusActive",
      actionLabel: "botActionPause",
      nextAction: "pause",
    });
  });

  it("mapeia paused para ação de resume", () => {
    expect(getBotStatusPresentation("paused", t)).toEqual({
      badgeTone: "neutral",
      badgeLabel: "botStatusPaused",
      actionLabel: "botActionResume",
      nextAction: "resume",
    });
  });
});
