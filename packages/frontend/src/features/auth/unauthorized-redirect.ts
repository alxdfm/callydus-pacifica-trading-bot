let navigateFn: ((path: string) => void) | null = null;
let clearAuthFn: (() => void) | null = null;
let resetAppStateFn: (() => void) | null = null;

export function registerUnauthorizedNavigator(fn: (path: string) => void) {
  navigateFn = fn;
}

export function registerClearAuth(fn: () => void) {
  clearAuthFn = fn;
}

export function registerResetAppState(fn: () => void) {
  resetAppStateFn = fn;
}

export function redirectToProfileOnUnauthorized() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem("pacifica.dashboard-flash");
    window.localStorage.removeItem("pacifica.app-state");
    window.localStorage.removeItem("walletName");
  }
  clearAuthFn?.();
  resetAppStateFn?.();
  navigateFn?.("/onboarding");
}
