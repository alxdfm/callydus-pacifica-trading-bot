import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./ui/layout/AppLayout";
import { DashboardPage } from "./ui/pages/DashboardPage";
import { HistoryPage } from "./ui/pages/HistoryPage";
import { OnboardingPage } from "./ui/pages/OnboardingPage";
import { PresetsPage } from "./ui/pages/PresetsPage";
import { TradesPage } from "./ui/pages/TradesPage";
import { ProductRouteGuard } from "./ui/router/ProductRouteGuard";

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
        element: <OnboardingPage />,
      },
      {
        element: <ProductRouteGuard />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/presets",
            element: <PresetsPage />,
          },
          {
            path: "/trades",
            element: <TradesPage />,
          },
          {
            path: "/history",
            element: <HistoryPage />,
          },
        ],
      },
    ],
  },
]);
