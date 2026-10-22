import { z } from "zod";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Schemas are built from the active dictionary so the same rules (and
 * translated messages) are used for client-side and server-side validation.
 */
type V = Dictionary["validation"];

// Supabase hashes passwords with bcrypt, which ignores bytes after 72.
const PASSWORD_MAX = 72;

const email = (v: V) => z.string().trim().toLowerCase().pipe(z.email({ error: v.emailInvalid }));

const newPassword = (v: V) =>
  z
    .string()
    .min(1, { error: v.passwordRequired })
    .min(8, { error: v.passwordTooShort })
    .max(PASSWORD_MAX, { error: v.passwordTooLong });

export function createLoginSchema(v: V) {
  return z.object({
    email: email(v),
    password: z.string().min(1, { error: v.passwordRequired }),
  });
}

export function createRegisterSchema(v: V) {
  return z
    .object({
      fullName: z
        .string()
        .trim()
        .min(1, { error: v.fullNameRequired })
        .max(100, { error: v.fullNameTooLong }),
      email: email(v),
      password: newPassword(v),
      confirmPassword: z.string().min(1, { error: v.passwordRequired }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      error: v.passwordsDontMatch,
      path: ["confirmPassword"],
    });
}

export function createForgotPasswordSchema(v: V) {
  return z.object({ email: email(v) });
}

export function createResetPasswordSchema(v: V) {
  return z
    .object({
      password: newPassword(v),
      confirmPassword: z.string().min(1, { error: v.passwordRequired }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      error: v.passwordsDontMatch,
      path: ["confirmPassword"],
    });
}

export type LoginInput = z.input<ReturnType<typeof createLoginSchema>>;
export type RegisterInput = z.input<ReturnType<typeof createRegisterSchema>>;
export type ForgotPasswordInput = z.input<ReturnType<typeof createForgotPasswordSchema>>;
export type ResetPasswordInput = z.input<ReturnType<typeof createResetPasswordSchema>>;
