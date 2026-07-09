import { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { defaultLocale, messages, type MessageKey } from "./messages";

type I18nContextValue = {
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function AppI18nProvider({ children }: PropsWithChildren) {
  // App é en-only desde a fase 5 do redesign — mensagens são estáticas, provider síncrono
  const value = useMemo<I18nContextValue>(
    () => ({
      t: (key) => messages[defaultLocale][key],
    }),
    [],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error("useI18n must be used within AppI18nProvider");
  }

  return value;
}
