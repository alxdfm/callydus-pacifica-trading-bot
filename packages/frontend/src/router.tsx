import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./ui/layout/AppLayout";
import { DashboardPage } from "./ui/pages/DashboardPage";
import { StrategiesListPage } from "./ui/pages/StrategiesListPage";
import { StrategyBuilderPage } from "./ui/pages/StrategyBuilderPage";
import { TradesPage } from "./ui/pages/TradesPage";
import { ProfileRouteGuard } from "./ui/router/ProfileRouteGuard";
import { ProductRouteGuard } from "./ui/router/ProductRouteGuard";

const OnboardingRoute = lazy(() =>
  import("./ui/pages/OnboardingRoute").then((module) => ({
    default: module.OnboardingRoute,
  })),
);

const ProfileRoute = lazy(() =>
  import("./ui/pages/ProfileRoute").then((module) => ({
    default: module.ProfileRoute,
  })),
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate replace to="/onboarding" />,
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: "/onboarding",
        element: (
          <Suspense fallback={<div className="page-stack">Loading onboarding...</div>}>
            <OnboardingRoute />
          </Suspense>
        ),
      },
      {
        element: <ProductRouteGuard />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/strategies",
            element: <StrategiesListPage />,
          },
          {
            path: "/strategies/builder",
            element: <StrategyBuilderPage />,
          },
          {
            path: "/trades",
            element: <TradesPage />,
          },
          {
            path: "/history",
            element: <Navigate replace to="/trades" />,
          },
          {
            path: "/operations",
            element: <Navigate replace to="/dashboard" />,
          },
        ],
      },
      {
        element: <ProfileRouteGuard />,
        children: [
          {
            path: "/profile",
            element: (
              <Suspense fallback={<div className="page-stack">Loading profile...</div>}>
                <ProfileRoute />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
]);
