import { describe, expect, it } from "vitest";
import { createLoginSchema, createRegisterSchema, createResetPasswordSchema } from "@/features/auth/schemas";
import { en } from "@/lib/i18n/dictionaries/en";
import { km } from "@/lib/i18n/dictionaries/km";

const validRegistration = {
  fullName: "Sok Dara",
  email: "dara@example.com",
  password: "correct-horse",
  confirmPassword: "correct-horse",
};

describe("register schema", () => {
  const schema = createRegisterSchema(en.validation);

  it("accepts a valid registration and normalises the email", () => {
    const result = schema.parse({ ...validRegistration, email: "  Dara@Example.COM " });
    expect(result.email).toBe("dara@example.com");
  });

  it("accepts a Khmer full name", () => {
    const result = schema.parse({ ...validRegistration, fullName: "  សុខ ដារា  " });
    expect(result.fullName).toBe("សុខ ដារា");
  });

  it("rejects mismatched passwords on the confirmation field", () => {
    const result = schema.safeParse({ ...validRegistration, confirmPassword: "different-one" });
    expect(result.success).toBe(false);
    const issue = result.error!.issues[0]!;
    expect(issue.path).toEqual(["confirmPassword"]);
    expect(issue.message).toBe(en.validation.passwordsDontMatch);
  });

  it("rejects short passwords, blank names and invalid emails", () => {
    const result = schema.safeParse({ fullName: "   ", email: "not-an-email", password: "short", confirmPassword: "short" });
    expect(result.success).toBe(false);
    const messages = result.error!.issues.map((i) => i.message);
    expect(messages).toContain(en.validation.fullNameRequired);
    expect(messages).toContain(en.validation.emailInvalid);
    expect(messages).toContain(en.validation.passwordTooShort);
  });

  it("rejects passwords longer than bcrypt's 72-byte limit", () => {
    const long = "a".repeat(73);
    const result = schema.safeParse({ ...validRegistration, password: long, confirmPassword: long });
    expect(result.error!.issues[0]!.message).toBe(en.validation.passwordTooLong);
  });

  it("returns messages in the dictionary's language", () => {
    const result = createRegisterSchema(km.validation).safeParse({ ...validRegistration, email: "bad" });
    expect(result.error!.issues[0]!.message).toBe(km.validation.emailInvalid);
  });
});

describe("login schema", () => {
  it("requires a password but does not enforce length rules on sign-in", () => {
    const schema = createLoginSchema(en.validation);
    expect(schema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(schema.safeParse({ email: "a@b.co", password: "" }).error!.issues[0]!.message).toBe(
      en.validation.passwordRequired,
    );
  });
});

describe("reset password schema", () => {
  it("requires matching passwords", () => {
    const schema = createResetPasswordSchema(en.validation);
    expect(schema.safeParse({ password: "new-password", confirmPassword: "new-password" }).success).toBe(true);
    expect(schema.safeParse({ password: "new-password", confirmPassword: "other-password" }).success).toBe(false);
  });
});
