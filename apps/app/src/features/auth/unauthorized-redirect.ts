let navigateFn: ((path: string) => void) | null = null;
let clearAuthFn: (() => void) | null = null;

export function registerUnauthorizedNavigator(fn: (path: string) => void) {
  navigateFn = fn;
}

export function registerClearAuth(fn: () => void) {
  clearAuthFn = fn;
}

export function redirectToProfileOnUnauthorized() {
  clearAuthFn?.();
  navigateFn?.("/profile");
}
