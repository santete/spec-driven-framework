// @keystone-owner    REQ-AUTH-001
// @spec-version      1.2.0
// @sdd-source        SDD-COMP-FEAT-AUTH
// @generated-by      keystone@0.0.1
// @generated-at      2026-06-05T09:08:59Z
// @run-id            run-2026-06-05-090859

import { describe, it, expect } from "vitest";
import { verifyLogin } from "../../../src/generated/auth/services/auth.service.js";
import type { User, LoginResult } from "../../../src/generated/auth/services/auth.service.js";

// ---------------------------------------------------------------------------
// Inline test fixtures (no external deps per TESTING_RULES.md)
// Fields from ENT-USER v2.0.0: id, email, password_hash, status,
//   failed_login_count, locked_until
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "alice@example.com",
    password_hash: "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$hash",
    status: "active" as const,
    failed_login_count: 0,
    locked_until: null,
    ...overrides,
  };
}

/** Stub hash verifier -- returns true when password equals "correct-password" */
const stubVerifyHash = (_hash: string, password: string): boolean =>
  password === "correct-password";

// ---------------------------------------------------------------------------
// AC-AUTH-001-01: valid credentials -> success + token + status 200
// ---------------------------------------------------------------------------

describe("REQ-AUTH-001 -- Login via email/password", () => {
  describe("AC-AUTH-001-01: valid credentials return session token", () => {
    it("returns success with token and status 200 on valid login (AC-AUTH-001-01)", () => {
      // Arrange
      const user = makeUser();
      const email = user.email;
      const password = "correct-password";

      // Act
      const result: LoginResult = verifyLogin(email, password, user, stubVerifyHash);

      // Assert
      expect(result.success).toBe(true);
      expect(result.status_code).toBe(200);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe("string");
      expect(result.token!.length).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it("resets failed_login_count context on successful login after prior failures", () => {
      // Arrange -- user had 3 prior failed attempts but is not yet locked
      const user = makeUser({ failed_login_count: 3 });

      // Act
      const result = verifyLogin(user.email, "correct-password", user, stubVerifyHash);

      // Assert -- should still succeed (invariant: failed_login_count resets on success)
      expect(result.success).toBe(true);
      expect(result.status_code).toBe(200);
      expect(result.token).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // AC-AUTH-001-02: 5+ failed attempts -> locked + status 429
  // -------------------------------------------------------------------------

  describe("AC-AUTH-001-02: account lockout after 5 failed attempts", () => {
    it("returns status 429 when failed_login_count >= 5 (AC-AUTH-001-02)", () => {
      // Arrange -- user already has 5 failed login attempts
      const user = makeUser({ failed_login_count: 5 });

      // Act
      const result = verifyLogin(user.email, "wrong-password", user, stubVerifyHash);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status_code).toBe(429);
      expect(result.error).toBeDefined();
    });

    it("returns status 429 when locked_until is in the future", () => {
      // Arrange -- account explicitly locked until a future timestamp
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const user = makeUser({
        failed_login_count: 5,
        locked_until: futureDate,
      });

      // Act
      const result = verifyLogin(user.email, "correct-password", user, stubVerifyHash);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status_code).toBe(429);
      expect(result.error).toBeDefined();
    });

    it("returns 429 even with correct password when account is locked", () => {
      // Arrange
      const futureDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const user = makeUser({
        failed_login_count: 6,
        locked_until: futureDate,
      });

      // Act
      const result = verifyLogin(user.email, "correct-password", user, stubVerifyHash);

      // Assert -- lock takes precedence over correct credentials
      expect(result.success).toBe(false);
      expect(result.status_code).toBe(429);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe("Edge case: user not found", () => {
    it("returns status 401 when user is null", () => {
      // Arrange -- no user found for this email
      const user = null;

      // Act
      const result = verifyLogin("unknown@example.com", "any-password", user, stubVerifyHash);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status_code).toBe(401);
      expect(result.error).toBeDefined();
      expect(result.token).toBeUndefined();
    });
  });

  describe("Edge case: suspended account", () => {
    it("returns status 403 when user status is suspended", () => {
      // Arrange
      const user = makeUser({ status: "suspended" as const });

      // Act
      const result = verifyLogin(user.email, "correct-password", user, stubVerifyHash);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status_code).toBe(403);
      expect(result.error).toBeDefined();
      expect(result.token).toBeUndefined();
    });
  });

  describe("Edge case: invalid password", () => {
    it("returns status 401 when password is incorrect", () => {
      // Arrange
      const user = makeUser();

      // Act
      const result = verifyLogin(user.email, "wrong-password", user, stubVerifyHash);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status_code).toBe(401);
      expect(result.error).toBeDefined();
      expect(result.token).toBeUndefined();
    });

    it("returns status 401 when password is empty string", () => {
      // Arrange
      const user = makeUser();

      // Act
      const result = verifyLogin(user.email, "", user, stubVerifyHash);

      // Assert
      expect(result.success).toBe(false);
      expect(result.status_code).toBe(401);
      expect(result.token).toBeUndefined();
    });
  });
});
