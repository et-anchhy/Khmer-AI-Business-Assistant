import "server-only";

/**
 * Server-only secrets. Importing this module from a Client Component fails the
 * build, so these values can never reach the browser.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}. See .env.example.`);
  }
  return value;
}

/** True when a real OpenAI key is set (not empty, not the .env.example placeholder). */
export function isAiConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.trim() && !key.startsWith("sk-your-"));
}

export const serverEnv = {
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get openaiApiKey() {
    return required("OPENAI_API_KEY");
  },
  get openaiModel() {
    return process.env.OPENAI_MODEL || "gpt-4.1-mini";
  },
};
