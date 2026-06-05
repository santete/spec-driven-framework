// @keystone-owner    ENT-SESSION
// @spec-version      1.0.0
// @sdd-source        SDD-DATA-ENT-SESSION
// @generated-by      keystone@0.0.1
// @generated-at      2026-06-05T09:28:29.189Z
// @run-id            run-2026-06-05-092829
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  user_id: text("user_id"),
  token_hash: text("token_hash"),
  expires_at: text("expires_at"),
  revoked: text("revoked"),
});
