import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logoUrl from "../../shared/assets/logo.svg";
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
  const { canAccessProduct, resetOnboardingState, setLocale, setRuntimeState, state } = useAppState();

  useEffect(() => {
    registerUnauthorizedNavigator(navigate);
  }, [navigate]);

  useEffect(() => {
    registerResetAppState(resetOnboardingState);
  }, [resetOnboardingState]);
  const { isReady, t } = useI18n();
  const canShowFullShell =
    canAccessProduct ||
    (state.wallet.sessionStatus === "connected" &&
      state.onboarding.accountLookupStatus === "existing_account");
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

  if (!isReady) {
    if (!canShowFullShell) {
      return <main className="onboarding-shell" />;
    }
    return (
      <div className="shell-skeleton">
        <div className="shell-skeleton__sidebar">
          <div className="sk-stack">
            <div className="sk-line sk-line--md sk-w-50" />
            <div className="sk-line sk-line--sm sk-w-70" />
          </div>
          <div className="sk-stack" style={{ marginTop: 16 }}>
            <div className="sk-line sk-line--sm sk-w-60" />
            <div className="sk-line sk-line--sm sk-w-50" />
            <div className="sk-line sk-line--sm sk-w-55" />
          </div>
        </div>
        <div className="shell-skeleton__content">
          <div className="sk-stack sk-stack--lg">
            <div className="sk-line sk-line--xs sk-w-25" />
            <div className="sk-line sk-line--lg sk-w-50" />
            <div className="sk-line sk-line--sm sk-w-70" />
          </div>
          <div className="metric-grid">
            {Array.from({ length: 5 }).map((_, i) => (
              <article key={i} className="stat-panel">
                <div className="sk-stack">
                  <div className="sk-line sk-line--xs sk-w-40" />
                  <div className="sk-line sk-line--xl sk-w-60" />
                  <div className="sk-line sk-line--xs sk-w-50" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!canShowFullShell) {
    return (
      <main className="onboarding-shell">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <img
            alt={`${t("appName")} logo`}
            className="shell-brand__logo"
            src={logoUrl}
          />
          <div className="shell-brand__copy">
            <p className="shell-sidebar__eyebrow">{t("appName")}</p>
            <p className="shell-brand__powered-by">
              Powered by{" "}
              <a
                href="https://www.pacifica.fi/"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "none" }}
                target="_blank"
              >
                Pacifica
              </a>
            </p>
            <h1>{t("appTagline")}</h1>
          </div>
        </div>
        <nav className="shell-nav shell-nav--desktop">
          <NavigationLinks />
        </nav>
        <div className="nav-card shell-side-card">
          <div className="row-between align-start">
            <span className={`badge badge--${strategyBadgeTone} no-margin`}>
              {strategyStatusLabel}
            </span>
            <span
              aria-hidden="true"
              className={`shell-side-card__signal shell-side-card__signal--${strategyIndicatorVariant}`}
            >
              <span className="shell-side-card__signal-core"></span>
            </span>
          </div>
          <strong>
            {hasActiveStrategy ? "YOUR Strategy" : t("presetSidebarTitle")}
          </strong>
          <p>
            {hasActiveStrategy
              ? `${t("yourStrategyRiskLabel")} · ${state.presets.activePreset?.editableConfig.symbol ?? ""}`
              : t("presetSidebarHint")}
          </p>
        </div>
        <label
          className="shell-locale shell-side-controls"
          htmlFor="locale-select"
        >
          <span>{t("localeLabel")}</span>
          <select
            id="locale-select"
            value={state.locale}
            onChange={(event) =>
              setLocale(event.target.value as typeof state.locale)
            }
          >
            <option value="en">{t("localeName")}</option>
          </select>
        </label>
      </aside>

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
