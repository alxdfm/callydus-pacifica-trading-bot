import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { useAppState } from "../../state/app-state";

export function ProductRouteGuard() {
  const { canAccessProduct, state } = useAppState();
  const { token } = useAuth();
  const location = useLocation();
  const canAccessViaExistingAccount =
    state.wallet.sessionStatus === "connected" &&
    state.onboarding.accountLookupStatus === "existing_account";

  // Sem token JWT toda rota do produto devolve 401 — volta para o onboarding
  // completar o sign-in SIWS
  if (!token || (!canAccessProduct && !canAccessViaExistingAccount)) {
    return <Navigate replace state={{ from: location.pathname }} to="/onboarding" />;
  }

  return <Outlet />;
}
