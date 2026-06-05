// @keystone-owner    REQ-AUTH-001
// @spec-version      1.2.0
// @sdd-source        SDD-COMP-FEAT-AUTH
// @generated-by      keystone@0.0.1
// @generated-at      2026-06-05T09:08:59Z
// @run-id            run-2026-06-05-090859

/**
 * AuthService -- Pure business logic for user authentication.
 *
 * Implements:
 *   AC-AUTH-001-01: Successful login returns session token (status 200)
 *   AC-AUTH-001-02: Account lockout after 5 consecutive failed attempts (status 429)
 *
 * Design decisions (from SDD-COMP-FEAT-AUTH):
 *   - Pure functions: no I/O, hash verification injected as callback
 *   - Lockout threshold: 5 consecutive failures (AC-AUTH-001-02)
 *   - Identical error messages for "not found" and "wrong password" (no user enumeration)
 *   - Token generation is a deterministic stub; real JWT issuance belongs in controller/infra layer
 */

import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum consecutive failed login attempts before lockout (AC-AUTH-001-02). */
export const MAX_FAILED_ATTEMPTS = 5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * User record shape matching ENT-USER v2.0.0 fields (snake_case for DB alignment).
 *
 * Fields from specs/auth/ENT-USER.md:
 *   id, email, password_hash, status, failed_login_count, locked_until
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  status: "active" | "suspended";
  failed_login_count: number;
  locked_until: string | null;
}

/**
 * Result of a login attempt. Pure value object -- no side effects.
 */
export interface LoginResult {
  success: boolean;
  status_code: number;
  token?: string;
  error?: string;
}

/**
 * Hash verification callback signature.
 * Injected by caller so this module stays pure (no I/O, no crypto dependency).
 */
export type HashVerifier = (hash: string, password: string) => boolean;

// ---------------------------------------------------------------------------
// Core business logic
// ---------------------------------------------------------------------------

/**
 * Verify login credentials and return a result object.
 *
 * This is a **pure function** (no I/O). All external dependencies (user lookup,
 * hash verification) are passed as arguments so tests can call it directly.
 *
 * Implements:
 *   AC-AUTH-001-01 -- Valid credentials: success=true, status_code=200, token present.
 *   AC-AUTH-001-02 -- 5+ failed attempts or locked_until in future: status_code=429.
 *
 * @param email       - User-supplied email.
 * @param password    - User-supplied plaintext password.
 * @param user        - User record from repository, or null if not found.
 * @param verifyHash  - Callback to verify password against stored hash (e.g. argon2id).
 * @returns LoginResult with success/failure, HTTP status code, optional token/error.
 */
export function verifyLogin(
  email: string,
  password: string,
  user: User | null,
  verifyHash: HashVerifier,
): LoginResult {
  // Step 1: User not found -- generic 401 to prevent user enumeration
  // (SDD-COMP-FEAT-AUTH error handling: identical message for not-found and wrong-password)
  if (user === null) {
    return {
      success: false,
      status_code: 401,
      error: "Invalid email or password",
    };
  }

  // Step 2: Check account lockout (AC-AUTH-001-02)
  // If locked_until is a future timestamp, reject regardless of credentials
  if (user.locked_until !== null) {
    const lockedUntilDate = new Date(user.locked_until);
    if (lockedUntilDate.getTime() > Date.now()) {
      return {
        success: false,
        status_code: 429,
        error: "Account is temporarily locked due to too many failed login attempts",
      };
    }
  }

  // Step 3: Check if failed_login_count has reached threshold (AC-AUTH-001-02)
  // Even without locked_until, 5+ failures means the account should be locked
  if (user.failed_login_count >= MAX_FAILED_ATTEMPTS) {
    return {
      success: false,
      status_code: 429,
      error: "Account is temporarily locked due to too many failed login attempts",
    };
  }

  // Step 4: Check suspended status (admin-initiated, not auto-lock)
  // Per SDD-COMP-FEAT-AUTH: suspended accounts return 403
  if (user.status === "suspended") {
    return {
      success: false,
      status_code: 403,
      error: "Account is suspended. Please contact support.",
    };
  }

  // Step 5: Verify password (argon2id, timing-safe via injected verifier)
  const isValid = verifyHash(user.password_hash, password);

  if (!isValid) {
    // Wrong password -- 401, generic message (no user enumeration)
    return {
      success: false,
      status_code: 401,
      error: "Invalid email or password",
    };
  }

  // Step 6: Success -- issue session token (AC-AUTH-001-01)
  // ENT-USER invariant: failed_login_count resets to 0 (handled by caller/repository)
  // Token is a UUID placeholder; real JWT issuance belongs in infrastructure layer
  const token = randomUUID();

  return {
    success: true,
    status_code: 200,
    token,
  };
}
