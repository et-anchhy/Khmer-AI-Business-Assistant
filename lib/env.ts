import { z } from "zod";

/**
 * Public (browser-safe) configuration. Each variable is referenced literally so
 * Next.js can inline it into the client bundle.
 */
// Values copied unchanged from .env.example.
const isPlaceholder = (value: string) => value.includes("your-project-ref") || value.startsWith("your-");

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().refine((v) => !isPlaceholder(v), "still the .env.example placeholder"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1)
    .refine((v) => !isPlaceholder(v), "still the .env.example placeholder"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

/** Thrown when required configuration is missing; lists variable names only, never values. */
export class EnvError extends Error {
  constructor(public readonly variables: string[], message: string) {
    super(message);
    this.name = "EnvError";
  }
}

let cached: PublicEnv | undefined;

export function getPublicEnv(): PublicEnv {
  if (cached) return cached;

  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  });

  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `${issue.path.join(".")} (${issue.message})`).join(", ");
    throw new EnvError(
      parsed.error.issues.map((issue) => issue.path.join(".")),
      `Invalid or missing environment variables: ${problems}. Set them in .env.local — see .env.example.`,
    );
  }

  cached = parsed.data;
  return cached;
}
