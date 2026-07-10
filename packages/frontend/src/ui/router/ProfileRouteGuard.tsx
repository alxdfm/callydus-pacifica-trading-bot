import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { useAppState } from "../../state/app-state";

export function ProfileRouteGuard() {
  const { state } = useAppState();
  const { token } = useAuth();
  const location = useLocation();
  const canAccessProfile = Boolean(
    state.onboarding.accountReady ||
      state.wallet.mainWalletPublicKey ||
      state.credentials.credentialId,
  );

  // Sem token JWT o snapshot do profile devolve 401 — volta pro onboarding
  // completar o sign-in SIWS
  if (!token || !canAccessProfile) {
    return <Navigate replace state={{ from: location.pathname }} to="/onboarding" />;
  }

  return <Outlet />;
}
