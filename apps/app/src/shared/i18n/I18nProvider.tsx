import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAppState } from "../../state/app-state";
import { messages, type MessageKey } from "./messages";

type I18nContextValue = {
  isReady: boolean;
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

async function loadMessages(locale: keyof typeof messages) {
  return Promise.resolve(messages[locale]);
}

export function AppI18nProvider({ children }: PropsWithChildren) {
  const {
    state: { locale },
  } = useAppState();
  const [isReady, setIsReady] = useState(false);
  const [activeMessages, setActiveMessages] = useState(messages[locale]);

  useEffect(() => {
    let isMounted = true;

    setIsReady(false);
    void loadMessages(locale).then((nextMessages) => {
      if (!isMounted) {
        return;
      }

      setActiveMessages(nextMessages);
      setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      isReady,
      t: (key) => activeMessages[key],
    }),
    [activeMessages, isReady],
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
