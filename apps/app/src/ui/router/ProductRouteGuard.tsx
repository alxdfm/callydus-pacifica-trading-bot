import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppState } from "../../state/app-state";

export function ProductRouteGuard() {
  const { canAccessProduct, state } = useAppState();
  const location = useLocation();
  const canAccessViaExistingAccount =
    state.wallet.sessionStatus === "connected" &&
    state.onboarding.accountLookupStatus === "existing_account";

  if (!canAccessProduct && !canAccessViaExistingAccount) {
    return <Navigate replace state={{ from: location.pathname }} to="/onboarding" />;
  }

  return <Outlet />;
}
