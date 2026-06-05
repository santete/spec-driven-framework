// @keystone-owner    ENT-USER
// @spec-version      2.0.0
// @sdd-source        SDD-DATA-ENT-USER
// @generated-by      keystone@0.0.1
// @generated-at      2026-06-05T09:08:59Z
// @run-id            run-2026-06-05-090859

import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Users table -- Drizzle ORM schema definition.
 *
 * Source: ENT-USER entity (6 domain fields) + 2 audit columns (created_at, updated_at).
 * See SDD-DATA-ENT-USER table definition for column mapping.
 */
export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  passwordHash: varchar("password_hash", { length: 256 }).notNull(),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** TypeScript type for a selected user row. */
export type User = typeof usersTable.$inferSelect;

/** TypeScript type for inserting a new user row. */
export type NewUser = typeof usersTable.$inferInsert;
