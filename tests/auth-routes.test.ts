import { describe, expect, it } from "vitest";
import { isProtectedPath, resolveAuthRedirect, safeRedirectPath } from "@/lib/auth/routes";

describe("route protection", () => {
  it.each([
    "/dashboard",
    "/dashboard/products",
    "/dashboard/orders/123",
    "/onboarding",
    "/reset-password",
  ])("treats %s as protected", (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it("does not treat lookalike paths as protected", () => {
    expect(isProtectedPath("/dashboarding")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
  });

  it("redirects signed-out users to login and remembers where they were going", () => {
    expect(
      resolveAuthRedirect({ pathname: "/dashboard/products", search: "?q=shirt", isAuthenticated: false }),
    ).toBe("/login?next=%2Fdashboard%2Fproducts%3Fq%3Dshirt");
  });

  it("lets signed-in users through to protected pages", () => {
    expect(resolveAuthRedirect({ pathname: "/dashboard", search: "", isAuthenticated: true })).toBeNull();
  });

  it("sends signed-in users away from login and register", () => {
    expect(resolveAuthRedirect({ pathname: "/login", search: "", isAuthenticated: true })).toBe("/dashboard");
    expect(resolveAuthRedirect({ pathname: "/register", search: "", isAuthenticated: true })).toBe("/dashboard");
  });

  it("leaves public routes alone", () => {
    expect(resolveAuthRedirect({ pathname: "/auth/callback", search: "", isAuthenticated: false })).toBeNull();
    expect(resolveAuthRedirect({ pathname: "/login", search: "", isAuthenticated: false })).toBeNull();
  });
});

describe("safeRedirectPath (open-redirect protection)", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeRedirectPath("/dashboard/orders?status=pending")).toBe("/dashboard/orders?status=pending");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "dashboard",
    "",
    null,
    undefined,
  ])("rejects %s", (value) => {
    expect(safeRedirectPath(value)).toBe("/dashboard");
  });
});
