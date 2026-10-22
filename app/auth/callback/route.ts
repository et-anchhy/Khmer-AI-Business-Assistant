import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { LOGIN_PATH, safeRedirectPath } from "@/lib/auth/routes";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/**
 * Landing point for links in Supabase auth emails (confirm sign-up, reset
 * password). Supports both the PKCE `code` flow and `token_hash` templates.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeRedirectPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let failed = true;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) logger.warn("auth.callback", "Code exchange failed", { code: error.code });
    failed = Boolean(error);
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) logger.warn("auth.callback", "OTP verification failed", { code: error.code });
    failed = Boolean(error);
  }

  const target = failed ? `${LOGIN_PATH}?notice=link-invalid` : next;
  return NextResponse.redirect(new URL(target, request.url));
}
