import { NavLink, Outlet, useLocation } from "react-router-dom";
import { getPresetCatalogItemByDefinitionId } from "../../features/presets/preset-catalog";
import { useAppState } from "../../state/app-state";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { navigationItems } from "./navigation";

function NavigationLinks() {
  const { t } = useI18n();

  return (
    <>
      {navigationItems.map((item) => (
        <NavLink
          key={item.to}
          className={({ isActive }) =>
            isActive ? "shell-nav__link shell-nav__link--active" : "shell-nav__link"
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
  const { canAccessProduct, setLocale, state } = useAppState();
  const { isReady, t } = useI18n();
  const isOnboardingRoute = location.pathname === "/onboarding";
  const activePresetItem = getPresetCatalogItemByDefinitionId(
    state.presets.activePreset?.presetDefinitionId,
  );

  if (!isReady) {
    return <div className="shell-loading">Loading messages...</div>;
  }

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div>
          <p className="shell-sidebar__eyebrow">{t("navSection")}</p>
          <div className="shell-brand">
            <span className="shell-brand__mark">P</span>
            <div>
              <h1>{t("appName")}</h1>
              <p>{t("appTagline")}</p>
            </div>
          </div>
        </div>
        <nav className="shell-nav shell-nav--desktop">
          <NavigationLinks />
        </nav>
        <div className="nav-card shell-side-card">
          <span className={`badge badge--${activePresetItem ? "warning" : "neutral"}`}>
            {activePresetItem ? t("presetSidebarActive") : t("presetSidebarEmpty")}
          </span>
          <strong>
            {activePresetItem ? activePresetItem.definition.name : t("presetSidebarTitle")}
          </strong>
          <p>
            {activePresetItem
              ? `${activePresetItem.definition.riskLabel} · ${state.presets.activePreset?.editableConfig.symbol ?? activePresetItem.defaultEditableConfig.symbol}`
              : t("presetSidebarHint")}
          </p>
        </div>
      </aside>

      <div className="shell-body">
        {!isOnboardingRoute ? (
          <header className="shell-topbar">
            <div>
              <span className="shell-topbar__status">{t("topbarStatus")}</span>
              <h2>{t("shellFoundationTitle")}</h2>
            </div>

            <div className="shell-topbar__controls">
              <span className="shell-badge">
                {canAccessProduct ? t("shellReadyBadge") : t("shellBlockedBadge")}
              </span>
              <label className="shell-locale" htmlFor="locale-select">
                <span>{t("localeLabel")}</span>
                <select
                  id="locale-select"
                  value={state.locale}
                  onChange={(event) => setLocale(event.target.value as typeof state.locale)}
                >
                  <option value="en">{t("localeName")}</option>
                </select>
              </label>
            </div>
          </header>
        ) : null}

        <nav aria-label={t("mobileMenuLabel")} className="shell-nav shell-nav--mobile">
          <NavigationLinks />
        </nav>

        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
