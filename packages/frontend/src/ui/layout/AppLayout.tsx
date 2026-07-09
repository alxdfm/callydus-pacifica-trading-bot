import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logoUrl from "../../shared/assets/logo.svg";
import { useAuth } from "../../features/auth/AuthContext";
import { registerUnauthorizedNavigator, registerResetAppState } from "../../features/auth/unauthorized-redirect";
import { useAppState } from "../../state/app-state";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { getNavigationItems } from "./navigation";

function NavigationLinks() {
  const { t } = useI18n();
  const navigationItems = getNavigationItems();

  return (
    <>
      {navigationItems.map((item) => (
        <NavLink
          key={item.to}
          className={({ isActive }) =>
            isActive
              ? "shell-nav__link shell-nav__link--active"
              : "shell-nav__link"
          }
          to={item.to}
        >
          {t(item.labelKey)}
        </NavLink>
      ))}
    </>
  );
}

export function AppLayout() {
  const navigate = useNavigate();
  const { canAccessProduct, resetOnboardingState, setRuntimeState, state } = useAppState();

  useEffect(() => {
    registerUnauthorizedNavigator(navigate);
  }, [navigate]);

  useEffect(() => {
    registerResetAppState(resetOnboardingState);
  }, [resetOnboardingState]);
  const { t } = useI18n();
  const { token } = useAuth();
  // Sem token o shell fica estável no modo onboarding: alternar o wrapper
  // REMONTA a subárvore (OnboardingRoute → WalletEnvironment → bridge), e o
  // flap connected/existing_account durante o SIWS vira loop infinito de
  // remount + nonce + popup
  const canShowFullShell =
    Boolean(token) &&
    (canAccessProduct ||
      (state.wallet.sessionStatus === "connected" &&
        state.onboarding.accountLookupStatus === "existing_account"));
  const hasActiveStrategy = Boolean(state.presets.activePreset);
  const isStrategyRunning =
    hasActiveStrategy &&
    (state.runtime.botStatus === "active" ||
      state.runtime.botStatus === "syncing");
  const strategyIndicatorVariant = isStrategyRunning
    ? "running"
    : hasActiveStrategy
      ? "configured"
      : "idle";
  const strategyBadgeTone = isStrategyRunning
    ? "warning"
    : hasActiveStrategy
      ? "info"
      : "neutral";
  const strategyStatusLabel = isStrategyRunning
    ? t("presetSidebarRunning")
    : hasActiveStrategy
      ? t("presetSidebarConfigured")
      : t("presetSidebarEmpty");

  useEffect(() => {
    if (!state.runtime.actionToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRuntimeState({
        actionToast: null,
      });
    }, 4_500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [setRuntimeState, state.runtime.actionToast]);

  if (!canShowFullShell) {
    return (
      <main className="onboarding-shell">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="shell shell--topbar">
      <header className="shell-topnav">
        <div className="shell-topnav__brand">
          <img
            alt={`${t("appName")} logo`}
            className="shell-topnav__logo"
            src={logoUrl}
          />
          <span className="shell-topnav__wordmark">{t("appName")}</span>
        </div>
        <nav aria-label={t("navSection")} className="shell-nav shell-nav--desktop">
          <NavigationLinks />
        </nav>
        <div className="shell-topnav__status">
          <span
            aria-hidden="true"
            className={`shell-side-card__signal shell-side-card__signal--${strategyIndicatorVariant}`}
          >
            <span className="shell-side-card__signal-core"></span>
          </span>
          <span className={`badge badge--${strategyBadgeTone} no-margin`}>
            {strategyStatusLabel}
          </span>
        </div>
      </header>

      <div className="shell-body">
        {state.runtime.actionToast ? (
          <div className="shell-toast-host" role="status" aria-live="polite">
            <section
              className={`shell-toast shell-toast--${state.runtime.actionToast.tone}`}
            >
              <p>{state.runtime.actionToast.message}</p>
            </section>
          </div>
        ) : null}

        <nav
          aria-label={t("mobileMenuLabel")}
          className="shell-nav shell-nav--mobile"
        >
          <NavigationLinks />
        </nav>

        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
