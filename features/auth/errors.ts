import type { Dictionary } from "@/lib/i18n/dictionaries";

type AuthErrorKey = keyof Dictionary["auth"]["errors"];

/** Maps Supabase Auth error codes to user-facing message keys. Never shows raw errors. */
export function authErrorKey(error: { code?: string; status?: number } | null | undefined): AuthErrorKey {
  switch (error?.code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "user_already_exists":
    case "email_exists":
      return "userExists";
    case "weak_password":
      return "weakPassword";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimited";
  }
  if (error?.status === 429) return "rateLimited";
  // supabase-js reports network failures (DNS, timeout, offline) as status 0.
  if (error?.status === 0) return "unavailable";
  return "generic";
}
