// @keystone-owner    REQ-USER-002
// @spec-version      1.0.0
// @sdd-source        SDD-COMP-FEAT-AUTH
// @generated-by      keystone@0.0.1
// @generated-at      2026-06-05T09:28:29.206Z
// @run-id            run-2026-06-05-092829
import { describe, it, expect } from "vitest";
import { verifyLogin } from "../../../src/generated/auth/services/auth.service.js";
import type { User } from "../../../src/generated/auth/services/auth.service.js";

const validUser: User = {
  id: "u1", email: "test@example.com", password_hash: "hashed_password",
  status: "active", failed_login_count: 0, locked_until: null,
};

describe("Auth Service — generated from REQ-USER-002", () => {
  it("returns token on valid credentials (AC-AUTH-001-01)", () => {
    const result = verifyLogin("test@example.com", "correct", validUser, () => true);
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.status_code).toBe(200);
  });
  it("returns 401 on invalid credentials", () => {
    const result = verifyLogin("test@example.com", "wrong", validUser, () => false);
    expect(result.success).toBe(false);
    expect(result.status_code).toBe(401);
  });
  it("returns 401 when user not found", () => {
    const result = verifyLogin("nobody@example.com", "pwd", null);
    expect(result.success).toBe(false);
    expect(result.status_code).toBe(401);
  });
  it("returns 429 when failed_login_count >= 5 (AC-AUTH-001-02)", () => {
    const lockedUser: User = { ...validUser, failed_login_count: 5 };
    const result = verifyLogin("test@example.com", "any", lockedUser);
    expect(result.success).toBe(false);
    expect(result.status_code).toBe(429);
  });
  it("returns 403 when account suspended", () => {
    const suspendedUser: User = { ...validUser, status: "suspended" };
    const result = verifyLogin("test@example.com", "any", suspendedUser);
    expect(result.success).toBe(false);
    expect(result.status_code).toBe(403);
  });
});
