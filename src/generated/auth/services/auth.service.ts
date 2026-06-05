// @keystone-owner    REQ-USER-002
// @spec-version      1.0.0
// @sdd-source        SDD-COMP-FEAT-AUTH
// @generated-by      keystone@0.0.1
// @generated-at      2026-06-05T09:28:29.205Z
// @run-id            run-2026-06-05-092829
/**
 * Auth service — generated from REQ-USER-002 v1.0.0.
 * Pure functions, no I/O. Phase 0 template.
 */

export interface User {
  id: string;
  email: string;
  password_hash: string;
  status: "active" | "suspended";
  failed_login_count: number;
  locked_until: string | null;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  error?: string;
  status_code: number;
}

const MAX_FAILED_ATTEMPTS = 5;

/**
 * Verify login credentials.
 * AC-USER-002-01: given user đã đăng nhập, when gọi PATCH /users/me với display_name mới, then cập nhật thành công, trả về user updated, status 200
 */
export function verifyLogin(
  email: string,
  password: string,
  user: User | null,
  verifyHash: (hash: string, password: string) => boolean = () => true,
): LoginResult {
  if (!user) return { success: false, error: "user_not_found", status_code: 401 };
  if (user.status === "suspended") return { success: false, error: "account_suspended", status_code: 403 };
  if (user.locked_until) {
    const lockExpiry = new Date(user.locked_until);
    if (lockExpiry > new Date()) return { success: false, error: "account_locked", status_code: 429 };
  }
  if (user.failed_login_count >= MAX_FAILED_ATTEMPTS) return { success: false, error: "account_locked", status_code: 429 };
  if (!verifyHash(user.password_hash, password)) return { success: false, error: "invalid_credentials", status_code: 401 };
  const token = `token_${user.id}_${Date.now()}`;
  return { success: true, token, status_code: 200 };
}
