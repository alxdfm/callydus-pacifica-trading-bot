import { NavLink, Outlet } from "react-router-dom";
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
  const { canAccessProduct, setLocale, state } = useAppState();
  const { isReady, t } = useI18n();

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
      </aside>

      <div className="shell-body">
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

        <nav aria-label={t("mobileMenuLabel")} className="shell-nav shell-nav--mobile">
          <NavigationLinks />
        </nav>

        <main className="shell-content">
          <section className="shell-foundation-card">
            <p>{t("shellFoundationDescription")}</p>
            <p>{t("shellOnboardingHint")}</p>
          </section>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
