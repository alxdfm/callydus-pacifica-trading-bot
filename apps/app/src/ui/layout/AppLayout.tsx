import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import logoUrl from "../../shared/assets/logo.svg";
import { getPresetCatalogItemByDefinitionId } from "../../features/presets/preset-catalog";
import { useAppState } from "../../state/app-state";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { LoadingPanel } from "../components/LoadingPanel";
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
  const location = useLocation();
  const { setLocale, setRuntimeState, state } = useAppState();
  const { isReady, t } = useI18n();
  const isOnboardingRoute = location.pathname === "/onboarding";
  const activePresetItem = getPresetCatalogItemByDefinitionId(
    state.presets.activePreset?.presetDefinitionId,
    t,
  );
  const hasActiveStrategy = Boolean(activePresetItem && state.presets.activePreset);
  const isStrategyRunning =
    hasActiveStrategy &&
    (state.runtime.botStatus === "active" || state.runtime.botStatus === "syncing");
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
    return (
      <main className="shell-loading">
        <LoadingPanel compact title="Loading interface" />
      </main>
    );
  }

  if (isOnboardingRoute) {
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
            <h1>{t("appTagline")}</h1>
          </div>
        </div>
        <nav className="shell-nav shell-nav--desktop">
          <NavigationLinks />
        </nav>
        <div className="nav-card shell-side-card">
          <div className="row-between align-start">
            <span className={`badge badge--${strategyBadgeTone}`}>
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
            {activePresetItem
              ? activePresetItem.definition.name
              : t("presetSidebarTitle")}
          </strong>
          <p>
            {activePresetItem
              ? `${activePresetItem.definition.riskLabel} · ${state.presets.activePreset?.editableConfig.symbol ?? activePresetItem.defaultEditableConfig.symbol}`
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
            <section className={`shell-toast shell-toast--${state.runtime.actionToast.tone}`}>
              <p>{state.runtime.actionToast.message}</p>
              <button
                aria-label={t("modalCloseAction")}
                className="shell-toast__close"
                onClick={() =>
                  setRuntimeState({
                    actionToast: null,
                  })
                }
                type="button"
              >
                {t("modalCloseAction")}
              </button>
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
