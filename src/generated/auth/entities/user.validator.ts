// @keystone-owner    ENT-USER
// @spec-version      2.0.0
// @sdd-source        SDD-DATA-ENT-USER
// @generated-by      keystone@0.0.1
// @generated-at      2026-06-05T09:08:59Z
// @run-id            run-2026-06-05-090859

import { z } from "zod";

/**
 * User status enum values.
 * Source: ENT-USER field `status` -- enum [active, suspended].
 */
export const USER_STATUS = ["active", "suspended"] as const;
export type UserStatus = (typeof USER_STATUS)[number];

/**
 * Zod schema for inserting a new user.
 * Validates all required ENT-USER fields at the boundary layer.
 *
 * Fields derived from ENT-USER spec (specs/auth/ENT-USER.md fields):
 *   id            -- uuid, optional on insert (DB generates default)
 *   email         -- string, required, RFC 5322 email format, lowercased
 *   status        -- enum(active, suspended), defaults to "active"
 *   password_hash -- string, required (argon2id hash, never plaintext)
 *   failed_login_count -- integer, defaults to 0
 *   locked_until  -- timestamp, optional (null when not locked)
 */
export const insertUserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email().toLowerCase(),
  status: z.enum(USER_STATUS).default("active"),
  passwordHash: z.string().min(1),
  failedLoginCount: z.number().int().nonnegative().default(0),
  lockedUntil: z.date().nullable().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

/**
 * Zod schema for a selected user row (all fields present).
 */
export const selectUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  status: z.enum(USER_STATUS),
  passwordHash: z.string(),
  failedLoginCount: z.number().int().nonnegative(),
  lockedUntil: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SelectUser = z.infer<typeof selectUserSchema>;

/**
 * Zod schema for login request body validation.
 * Used by AuthController to validate POST /auth/login.
 */
export const loginRequestSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
