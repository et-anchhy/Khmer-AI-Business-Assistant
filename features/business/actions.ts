"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fail, fieldErrorsFrom, ok, type ActionResult } from "@/lib/action-result";
import { getCurrentBusiness, requireBusiness, requireUser } from "@/lib/auth/session";
import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/routes";
import { getI18n } from "@/lib/i18n/server";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { createBusiness, updateBusiness } from "@/services/business";
import { createBusinessSchema, type BusinessFormInput } from "./schemas";

const UNIQUE_VIOLATION = "23505";

export async function createBusinessAction(input: BusinessFormInput): Promise<ActionResult> {
  const user = await requireUser();
  const { t } = await getI18n();

  const parsed = createBusinessSchema(t.validation).safeParse(input);
  if (!parsed.success) return fail(t.business.errors.saveFailed, fieldErrorsFrom(parsed.error));

  // One business per owner (also enforced by a unique constraint).
  if (await getCurrentBusiness()) redirect(DEFAULT_AUTHENTICATED_PATH);

  try {
    const supabase = await createClient();
    await createBusiness(supabase, user.id, parsed.data);
  } catch (error) {
    if ((error as { code?: string }).code === UNIQUE_VIOLATION) redirect(DEFAULT_AUTHENTICATED_PATH);
    logger.error("business.create", "Failed to create business", error, { userId: user.id });
    return fail(t.business.errors.saveFailed);
  }

  revalidatePath("/", "layout");
  redirect(DEFAULT_AUTHENTICATED_PATH);
}

export async function updateBusinessAction(input: BusinessFormInput): Promise<ActionResult> {
  const { business } = await requireBusiness();
  const { t } = await getI18n();

  const parsed = createBusinessSchema(t.validation).safeParse(input);
  if (!parsed.success) return fail(t.business.errors.saveFailed, fieldErrorsFrom(parsed.error));

  try {
    const supabase = await createClient();
    // The id comes from the session, never from the request.
    await updateBusiness(supabase, business.id, parsed.data);
  } catch (error) {
    logger.error("business.update", "Failed to update business", error, { businessId: business.id });
    return fail(t.business.errors.saveFailed);
  }

  revalidatePath("/dashboard", "layout");
  return ok(undefined, t.business.settings.saved);
}
