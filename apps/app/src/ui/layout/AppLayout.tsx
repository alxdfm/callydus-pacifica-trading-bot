import { NavLink, Outlet, useLocation } from "react-router-dom";
import logoUrl from "../../shared/assets/logo.svg";
import { getPresetCatalogItemByDefinitionId } from "../../features/presets/preset-catalog";
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
  const location = useLocation();
  const { setLocale, state } = useAppState();
  const { isReady, t } = useI18n();
  const isOnboardingRoute = location.pathname === "/onboarding";
  const activePresetItem = getPresetCatalogItemByDefinitionId(
    state.presets.activePreset?.presetDefinitionId,
    t,
  );

  if (!isReady) {
    return <div className="shell-loading">Loading messages...</div>;
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
          <span
            className={`badge badge--${state.runtime.botStatus === "active" ? "warning" : "neutral"}`}
          >
            {state.runtime.botStatus === "active"
              ? t("presetSidebarActive")
              : t("presetSidebarEmpty")}
          </span>
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
