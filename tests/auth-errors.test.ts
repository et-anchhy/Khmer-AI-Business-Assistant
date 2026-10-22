import { describe, expect, it } from "vitest";
import { authErrorKey } from "@/features/auth/errors";

describe("authErrorKey", () => {
  it("maps known Supabase codes", () => {
    expect(authErrorKey({ code: "invalid_credentials", status: 400 })).toBe("invalidCredentials");
    expect(authErrorKey({ code: "user_already_exists", status: 422 })).toBe("userExists");
    expect(authErrorKey({ code: "over_email_send_rate_limit", status: 429 })).toBe("rateLimited");
  });

  it("treats status 0 (DNS failure, timeout, offline) as the server being unreachable", () => {
    expect(authErrorKey({ status: 0 })).toBe("unavailable");
  });

  it("falls back to a generic message", () => {
    expect(authErrorKey({ code: "something_new", status: 500 })).toBe("generic");
    expect(authErrorKey(null)).toBe("generic");
  });
});
