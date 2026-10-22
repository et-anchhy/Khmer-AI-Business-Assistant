type Meta = Record<string, unknown>;

function serialize(error: unknown): Meta | undefined {
  if (!error) return undefined;
  if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack };
  if (typeof error === "object") return { ...(error as Meta) };
  return { value: String(error) };
}

/**
 * Minimal structured server logger. Never pass passwords, tokens or API keys in
 * `meta`. Swap the console calls for a log drain (Sentry, Axiom, ...) later.
 */
export const logger = {
  info(scope: string, message: string, meta?: Meta) {
    console.info(JSON.stringify({ level: "info", scope, message, ...meta }));
  },
  warn(scope: string, message: string, meta?: Meta) {
    console.warn(JSON.stringify({ level: "warn", scope, message, ...meta }));
  },
  error(scope: string, message: string, error?: unknown, meta?: Meta) {
    console.error(JSON.stringify({ level: "error", scope, message, error: serialize(error), ...meta }));
  },
};
