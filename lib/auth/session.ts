import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { getBusinessByOwner } from "@/services/business";
import type { Business } from "@/types/database";
import { LOGIN_PATH, ONBOARDING_PATH } from "./routes";

/**
 * The authenticated user for this request, verified with the Supabase Auth
 * server (never trusted from the cookie alone). Deduplicated per request.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

/** Use at the top of every protected layout, page and Server Action. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  return user;
}

/** The signed-in user's business, or null if they have not completed onboarding. */
export const getCurrentBusiness = cache(async (): Promise<Business | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  try {
    return await getBusinessByOwner(supabase, user.id);
  } catch (error) {
    logger.error("session.business", "Failed to load business", error, { userId: user.id });
    throw new Error("Failed to load business");
  }
});

/**
 * Use in every page and Server Action that touches business data. The
 * returned business id is the only one server code should ever use — never
 * trust a business id sent by the client.
 */
export async function requireBusiness(): Promise<{ user: User; business: Business }> {
  const user = await requireUser();
  const business = await getCurrentBusiness();
  if (!business) redirect(ONBOARDING_PATH);
  return { user, business };
}

export function displayNameOf(user: User): string {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  return user.email?.split("@")[0] ?? "";
}
