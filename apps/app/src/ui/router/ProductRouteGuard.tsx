import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppState } from "../../state/app-state";

export function ProductRouteGuard() {
  const { canAccessProduct } = useAppState();
  const location = useLocation();

  if (!canAccessProduct) {
    return <Navigate replace state={{ from: location.pathname }} to="/onboarding" />;
  }

  return <Outlet />;
}
