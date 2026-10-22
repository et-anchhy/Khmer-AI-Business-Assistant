/** Pages for signed-out users. Signed-in users are sent to the dashboard instead. */
export const AUTH_PAGES = ["/login", "/register", "/forgot-password"] as const;

/** Prefixes that require a session. */
export const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/reset-password"] as const;

export const LOGIN_PATH = "/login";
export const DEFAULT_AUTHENTICATED_PATH = "/dashboard";
export const ONBOARDING_PATH = "/onboarding";

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((page) => matchesPrefix(pathname, page));
}

/**
 * Returns `value` only if it is a same-origin relative path, so `?next=` cannot
 * be used as an open redirect (e.g. "//evil.com" or "https://evil.com").
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_AUTHENTICATED_PATH,
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  try {
    const base = "http://internal.invalid";
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/** Decides whether a request must be redirected. Returns the target path, or null to continue. */
export function resolveAuthRedirect({
  pathname,
  search,
  isAuthenticated,
}: {
  pathname: string;
  search: string;
  isAuthenticated: boolean;
}): string | null {
  if (!isAuthenticated && isProtectedPath(pathname)) {
    const next = encodeURIComponent(`${pathname}${search}`);
    return `${LOGIN_PATH}?next=${next}`;
  }
  if (isAuthenticated && isAuthPage(pathname)) {
    return DEFAULT_AUTHENTICATED_PATH;
  }
  return null;
}
