// @keystone-owner    ENT-USER
// @spec-version      2.0.0
// @sdd-source        SDD-DATA-ENT-USER
// @generated-by      keystone@0.0.1
// @generated-at      2026-06-05T09:28:29.192Z
// @run-id            run-2026-06-05-092829
import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  status: z.enum(["active", "suspended"]),
  password_hash: z.string(),
  failed_login_count: z.number().int(),
  locked_until: z.string().datetime().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;
