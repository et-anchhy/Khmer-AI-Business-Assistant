"use server";

import { redirect } from "next/navigation";
import { fail, fieldErrorsFrom, ok, type ActionResult } from "@/lib/action-result";
import { getPublicEnv } from "@/lib/env";
import { getI18n } from "@/lib/i18n/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_AUTHENTICATED_PATH, LOGIN_PATH, safeRedirectPath } from "@/lib/auth/routes";
import { authErrorKey } from "./errors";
import {
  createForgotPasswordSchema,
  createLoginSchema,
  createRegisterSchema,
  createResetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "./schemas";

function callbackUrl(next: string): string {
  const { NEXT_PUBLIC_SITE_URL } = getPublicEnv();
  const url = new URL("/auth/callback", NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("next", next);
  return url.toString();
}

export async function loginAction(input: LoginInput, next?: string): Promise<ActionResult> {
  const { t } = await getI18n();
  const parsed = createLoginSchema(t.validation).safeParse(input);
  if (!parsed.success) return fail(t.auth.errors.generic, fieldErrorsFrom(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Wrong passwords are expected; only log unexpected failures.
    if (error.code !== "invalid_credentials") {
      logger.warn("auth.login", "Sign-in failed", { code: error.code, status: error.status });
    }
    return fail(t.auth.errors[authErrorKey(error)]);
  }

  redirect(safeRedirectPath(next));
}

export async function registerAction(
  input: RegisterInput,
): Promise<ActionResult<{ needsEmailConfirmation: boolean; email: string }>> {
  const { t } = await getI18n();
  const parsed = createRegisterSchema(t.validation).safeParse(input);
  if (!parsed.success) return fail(t.auth.errors.generic, fieldErrorsFrom(parsed.error));

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: callbackUrl(DEFAULT_AUTHENTICATED_PATH),
    },
  });

  if (error) {
    logger.warn("auth.register", "Sign-up failed", { code: error.code, status: error.status });
    return fail(t.auth.errors[authErrorKey(error)]);
  }

  // With email confirmation enabled, Supabase returns no session yet.
  if (!data.session) return ok({ needsEmailConfirmation: true, email });

  // The dashboard layout sends users without a business to onboarding.
  redirect(DEFAULT_AUTHENTICATED_PATH);
}

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const { t } = await getI18n();
  const parsed = createForgotPasswordSchema(t.validation).safeParse(input);
  if (!parsed.success) return fail(t.auth.errors.generic, fieldErrorsFrom(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl("/reset-password"),
  });

  if (error) {
    logger.warn("auth.forgot-password", "Reset email failed", { code: error.code, status: error.status });
    // Only rate limiting is surfaced; anything else returns the same success
    // response so the form cannot be used to discover registered emails.
    if (authErrorKey(error) === "rateLimited") return fail(t.auth.errors.rateLimited);
  }

  return ok();
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const { t } = await getI18n();
  const parsed = createResetPasswordSchema(t.validation).safeParse(input);
  if (!parsed.success) return fail(t.auth.errors.generic, fieldErrorsFrom(parsed.error));

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return fail(t.auth.notices.linkInvalid);

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    logger.warn("auth.reset-password", "Password update failed", { code: error.code, status: error.status });
    return fail(t.auth.errors[authErrorKey(error)]);
  }

  return ok(undefined, t.auth.resetPassword.success);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) logger.error("auth.logout", "Sign-out failed", error);
  redirect(`${LOGIN_PATH}?notice=signed-out`);
}
