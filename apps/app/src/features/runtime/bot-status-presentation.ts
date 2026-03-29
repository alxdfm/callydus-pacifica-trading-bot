import type { BotStatus } from "@pacifica/contracts";

export type BotStatusPresentation = {
  badgeTone: "neutral" | "info" | "warning" | "danger" | "success";
  badgeLabel: string;
  actionLabel: string;
  nextAction: "pause" | "resume";
};

export function getBotStatusPresentation<TTranslate extends (key: any) => string>(
  botStatus: BotStatus,
  t: TTranslate,
): BotStatusPresentation {
  switch (botStatus) {
    case "active":
      return {
        badgeTone: "warning",
        badgeLabel: t("botStatusActive"),
        actionLabel: t("botActionPause"),
        nextAction: "pause",
      };
    case "syncing":
      return {
        badgeTone: "warning",
        badgeLabel: t("botStatusSyncing"),
        actionLabel: t("botActionPause"),
        nextAction: "pause",
      };
    case "paused":
      return {
        badgeTone: "neutral",
        badgeLabel: t("botStatusPaused"),
        actionLabel: t("botActionResume"),
        nextAction: "resume",
      };
    case "error":
      return {
        badgeTone: "danger",
        badgeLabel: t("botStatusError"),
        actionLabel: t("botActionRetry"),
        nextAction: "resume",
      };
    case "inactive":
    default:
      return {
        badgeTone: "info",
        badgeLabel: t("botStatusInactive"),
        actionLabel: t("botActionStart"),
        nextAction: "resume",
      };
  }
}
