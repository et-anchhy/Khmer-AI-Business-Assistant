"use server";

import { revalidatePath } from "next/cache";
import { fail, fieldErrorsFrom, ok, type ActionResult } from "@/lib/action-result";
import { requireBusiness } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { logger } from "@/lib/logger";
import { isUuid } from "@/lib/supabase/filters";
import { createClient } from "@/lib/supabase/server";
import {
  createKnowledgeEntry,
  deleteKnowledgeEntry,
  updateKnowledgeEntry,
} from "@/services/knowledge";
import { createKnowledgeSchema, type KnowledgeFormInput } from "./schemas";

const PATH = "/dashboard/knowledge";

/** Creates an entry, or updates it when `id` is given. */
export async function saveKnowledgeAction(input: KnowledgeFormInput, id?: string): Promise<ActionResult<{ id: string }>> {
  const { business } = await requireBusiness();
  const { t } = await getI18n();
  const e = t.knowledge.errors;

  const parsed = createKnowledgeSchema(t.validation).safeParse(input);
  if (!parsed.success) return fail(e.saveFailed, fieldErrorsFrom(parsed.error));
  if (id !== undefined && !isUuid(id)) return fail(e.notFound);

  try {
    const supabase = await createClient();
    if (id === undefined) {
      const created = await createKnowledgeEntry(supabase, business.id, parsed.data);
      revalidatePath(PATH);
      return ok(created, t.knowledge.created);
    }
    // The business id comes from the session; another business's entry is "not found".
    const updated = await updateKnowledgeEntry(supabase, business.id, id, parsed.data);
    if (!updated) return fail(e.notFound);
    revalidatePath(PATH);
    return ok({ id }, t.knowledge.updated);
  } catch (error) {
    logger.error("knowledge.save", "Failed to save knowledge entry", error, { businessId: business.id, id });
    return fail(e.saveFailed);
  }
}

export async function deleteKnowledgeAction(id: string): Promise<ActionResult> {
  const { business } = await requireBusiness();
  const { t } = await getI18n();
  const e = t.knowledge.errors;
  if (!isUuid(id)) return fail(e.notFound);

  try {
    const deleted = await deleteKnowledgeEntry(await createClient(), business.id, id);
    if (!deleted) return fail(e.notFound);
  } catch (error) {
    logger.error("knowledge.delete", "Failed to delete knowledge entry", error, { businessId: business.id, id });
    return fail(e.deleteFailed);
  }

  revalidatePath(PATH);
  return ok(undefined, t.knowledge.delete.deleted);
}
