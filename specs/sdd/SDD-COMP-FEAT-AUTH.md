---
id: SDD-COMP-FEAT-AUTH
type: sdd
title: "Component design for FEAT-AUTH"
version: 1.0.0
status: approved
derived_from:
  spec_ids: [FEAT-AUTH, REQ-AUTH-001]
components:
  - name: AuthController
    layer: controller
    module: src/generated/auth/controllers/
    responsibilities:
      - "Parse and validate login request body (email + password) via Zod schema"
      - "Delegate credential verification to AuthService"
      - "Return JWT session token on success (200)"
      - "Return RFC 7807 error on failure (401, 429)"
    depends: [AuthService]
    ownership_id: REQ-AUTH-001
  - name: AuthService
    layer: service
    module: src/generated/auth/services/
    responsibilities:
      - "Verify credentials using argon2id timing-safe comparison"
      - "Enforce account lockout after 5 consecutive failed attempts (AC-AUTH-001-02)"
      - "Issue JWT session token with configurable expiry"
      - "Reset failed_login_count on successful login"
      - "Set locked_until timestamp on lockout trigger"
    depends: [UserRepository]
    ownership_id: REQ-AUTH-001
  - name: UserRepository
    layer: repository
    module: src/generated/auth/repositories/
    responsibilities:
      - "Find user by email via Drizzle query"
      - "Update failed_login_count and locked_until fields"
      - "Update status field for account lockout"
    depends: []
    ownership_id: ENT-USER
risks:
  - "Argon2id parameter tuning (memory cost, iterations) affects both security and latency; must stay within p95 300ms budget (PROJECT non_functional_defaults.latency_p95_ms)"
  - "JWT secret management not covered in Phase 1 spec; using env var for now, must migrate to secret manager before prod"
  - "Account lockout duration not specified in REQ-AUTH-001; design decision needed on Retry-After value"
  - "Race condition on failed_login_count increment under concurrent requests to same account"
customer_approval:
  approved_by: auto
  approval_run_id: "run-2026-06-05-090859"
  approved_at: "2026-06-05T09:08:59Z"
---

# SDD-COMP-FEAT-AUTH -- Component Design for User Authentication

## Architecture overview

The authentication feature follows a three-layer architecture within a feature-folder layout (`src/generated/auth/`):

```
src/generated/auth/
  controllers/   AuthController   -- HTTP boundary, Zod validation, RFC 7807 errors
  services/      AuthService      -- Business logic: credential check, lockout, JWT issuance
  repositories/  UserRepository   -- Drizzle ORM queries against users table
```

**AuthController** is a Fastify route handler. It validates the incoming request body with a Zod schema (`loginRequestSchema`), delegates to **AuthService**, and maps service-level outcomes to HTTP responses.

**AuthService** contains all business rules from REQ-AUTH-001:
- Credential verification via argon2id (timing-safe).
- Account lockout logic: track `failed_login_count`, set `locked_until` after 5 consecutive failures, reject with 429 + `Retry-After` header when locked.
- JWT session token issuance on success.
- Reset of `failed_login_count` on successful login (per ENT-USER invariant).

**UserRepository** is a thin Drizzle wrapper. It queries the `users` table (defined in SDD-DATA-ENT-USER) and provides atomic update methods for login-related fields.

## Data flow

### Successful login (AC-AUTH-001-01)

```
Client
  |-- POST /auth/login { email, password }
  v
AuthController
  |-- validate body with Zod loginRequestSchema
  |-- call AuthService.login(email, password)
  v
AuthService
  |-- call UserRepository.findByEmail(email)
  |-- check user.status != suspended
  |-- check user.locked_until is null or expired
  |-- argon2id.verify(password, user.password_hash)
  |-- on match: reset failed_login_count to 0, issue JWT
  |-- return { session_token }
  v
AuthController
  |-- respond 200 { session_token }
```

### Failed login -- wrong password

```
AuthService
  |-- argon2id.verify fails
  |-- increment failed_login_count via UserRepository
  |-- if failed_login_count >= 5: set locked_until, set status = suspended
  |-- throw InvalidCredentialsError
  v
AuthController
  |-- respond 401 RFC 7807 { type, title, status, detail }
```

### Failed login -- account locked (AC-AUTH-001-02)

```
AuthService
  |-- check user.locked_until > now
  |-- throw AccountLockedError(retryAfter)
  v
AuthController
  |-- respond 429 RFC 7807 + Retry-After header
```

## Error handling

| Scenario | HTTP Status | RFC 7807 type | Detail |
|---|---|---|---|
| Valid credentials | 200 | n/a | `{ session_token }` |
| Invalid email (not found) | 401 | `/errors/invalid-credentials` | Generic message (no user enumeration) |
| Wrong password | 401 | `/errors/invalid-credentials` | Generic message (no user enumeration) |
| Account locked | 429 | `/errors/account-locked` | Includes `Retry-After` header |
| Validation error (bad body) | 400 | `/errors/validation-error` | Zod error details |
| Suspended account (admin) | 403 | `/errors/account-suspended` | Contact support |

Note: 401 responses for "not found" and "wrong password" use identical messages and timing to prevent user enumeration attacks.

## Open questions

- **Lockout duration**: REQ-AUTH-001 AC-AUTH-001-02 specifies temporary lockout but does not define the duration. Recommend 15 minutes as default, configurable via env var `AUTH_LOCKOUT_DURATION_MINUTES`.
- **JWT expiry**: Not specified in FEAT-AUTH. Recommend 1 hour access token. Refresh token flow deferred to future phase.
- **Rate limiting**: Global rate limiting (beyond per-account lockout) is not in scope for Phase 1 but should be considered for production.
