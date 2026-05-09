import type { ExchangeSnapshotStatus, SyncStatus } from "@pacifica/contracts";

type RuntimeSyncPresentation = {
  show: boolean;
  tone: "neutral" | "warning" | "danger";
  title: string;
  message: string;
};

export function getDashboardRuntimeSyncPresentation<TTranslate extends (key: any) => string>(
  syncStatus: SyncStatus,
  exchangeSnapshotStatus: ExchangeSnapshotStatus,
  exchangeSnapshotMessage: string | null,
  exchangeLastSyncedAt: string | null,
  lastErrorMessage: string | null,
  t: TTranslate,
): RuntimeSyncPresentation {
  if (exchangeSnapshotStatus === "last_known") {
    return {
      show: true,
      tone: "warning",
      title: t("runtimeExchangeLastKnownTitle"),
      message:
        exchangeSnapshotMessage ??
        (exchangeLastSyncedAt
          ? `${t("runtimeExchangeLastKnownDescription")} ${exchangeLastSyncedAt}`
          : t("runtimeExchangeLastKnownDescription")),
    };
  }

  switch (syncStatus) {
    case "syncing":
      return {
        show: true,
        tone: "warning",
        title: t("runtimeSyncSyncingTitle"),
        message: t("runtimeSyncSyncingDescription"),
      };
    case "degraded":
      return {
        show: true,
        tone: "warning",
        title: t("runtimeSyncDegradedTitle"),
        message: lastErrorMessage ?? t("runtimeSyncDegradedDescription"),
      };
    case "error":
      return {
        show: true,
        tone: "danger",
        title: t("runtimeSyncErrorTitle"),
        message: lastErrorMessage ?? t("runtimeSyncErrorDescription"),
      };
    case "idle":
      return {
        show: true,
        tone: "neutral",
        title: t("runtimeSyncIdleTitle"),
        message: t("runtimeSyncIdleDescription"),
      };
    case "healthy":
    default:
      return {
        show: false,
        tone: "neutral",
        title: "",
        message: "",
      };
  }
}

export function getSecondaryRuntimeSyncPresentation<TTranslate extends (key: any) => string>(
  syncStatus: SyncStatus,
  exchangeSnapshotStatus: ExchangeSnapshotStatus,
  exchangeSnapshotMessage: string | null,
  exchangeLastSyncedAt: string | null,
  lastErrorMessage: string | null,
  t: TTranslate,
): RuntimeSyncPresentation {
  if (exchangeSnapshotStatus === "last_known") {
    return {
      show: true,
      tone: "warning",
      title: t("runtimeExchangeLastKnownTitle"),
      message:
        exchangeSnapshotMessage ??
        (exchangeLastSyncedAt
          ? `${t("runtimeExchangeLastKnownDescription")} ${exchangeLastSyncedAt}`
          : t("runtimeExchangeLastKnownDescription")),
    };
  }

  if (syncStatus === "degraded") {
    return {
      show: true,
      tone: "warning",
      title: t("runtimeSyncDegradedTitle"),
      message: lastErrorMessage ?? t("runtimeSyncDegradedDescription"),
    };
  }

  if (syncStatus === "error") {
    return {
      show: true,
      tone: "danger",
      title: t("runtimeSyncErrorTitle"),
      message: lastErrorMessage ?? t("runtimeSyncErrorDescription"),
    };
  }

  return {
    show: false,
    tone: "neutral",
    title: "",
    message: "",
  };
}
