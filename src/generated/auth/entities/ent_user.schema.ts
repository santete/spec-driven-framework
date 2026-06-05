// @keystone-owner    ENT-USER
// @spec-version      2.0.0
// @sdd-source        SDD-DATA-ENT-USER
// @generated-by      keystone@0.0.1
// @generated-at      2026-06-05T09:28:29.192Z
// @run-id            run-2026-06-05-092829
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  status: text("status"),
  password_hash: text("password_hash"),
  failed_login_count: integer("failed_login_count"),
  locked_until: text("locked_until"),
});
