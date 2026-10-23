import "server-only";
import { isAiConfigured } from "@/lib/env.server";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Whether chat is usable, plus a setup hint: technical in development, generic in production. */
export function aiAvailability(t: Dictionary) {
  return {
    configured: isAiConfigured(),
    notConfiguredHint:
      process.env.NODE_ENV === "development" ? t.ai.notConfigured.developer : t.ai.notConfigured.owner,
  };
}
