import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppState } from "../../state/app-state";

export function ProfileRouteGuard() {
  const { state } = useAppState();
  const location = useLocation();
  const canAccessProfile = Boolean(
    state.onboarding.accountReady ||
      state.wallet.mainWalletPublicKey ||
      state.credentials.credentialId,
  );

  if (!canAccessProfile) {
    return <Navigate replace state={{ from: location.pathname }} to="/onboarding" />;
  }

  return <Outlet />;
}
