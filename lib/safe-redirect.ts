/**
 * Only allow same-origin, relative redirect targets (e.g. "/admin/genres").
 * Rejects absolute URLs and protocol-relative paths ("//evil.example.com")
 * to prevent an attacker-controlled `callbackUrl` from redirecting a user
 * off-site after login.
 */
export function getSafeRedirectPath(
  target: string | string[] | undefined | null,
  fallback = "/"
): string {
  if (typeof target !== "string") {
    return fallback;
  }

  if (!target.startsWith("/") || target.startsWith("//")) {
    return fallback;
  }

  return target;
}
