let navigateFn: ((path: string) => void) | null = null;

export function registerUnauthorizedNavigator(fn: (path: string) => void) {
  navigateFn = fn;
}

export function redirectToProfileOnUnauthorized() {
  navigateFn?.("/profile");
}
