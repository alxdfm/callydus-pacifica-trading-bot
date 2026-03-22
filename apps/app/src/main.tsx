import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { AppI18nProvider } from "./shared/i18n/I18nProvider";
import { AppStateProvider } from "./state/app-state";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppStateProvider>
      <AppI18nProvider>
        <RouterProvider router={router} />
      </AppI18nProvider>
    </AppStateProvider>
  </React.StrictMode>,
);
