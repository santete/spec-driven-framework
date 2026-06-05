---
id: SDD-DATA-ENT-USER
type: sdd
title: "Data schema design for ENT-USER entity"
version: 1.0.0
status: approved
derived_from:
  spec_ids: [ENT-USER]
components:
  - name: usersTable
    layer: repository
    module: src/generated/auth/schema/
    responsibilities:
      - "Define Drizzle ORM schema for users table"
      - "Provide Zod inferred types for insert and select"
      - "Enforce unique constraint on email"
      - "Enforce enum constraint on status (active, suspended)"
    depends: []
    ownership_id: ENT-USER
  - name: UserZodSchemas
    layer: service
    module: src/generated/auth/schema/
    responsibilities:
      - "Provide Zod validation schemas derived from Drizzle table definition"
      - "Validate email format (RFC 5322)"
      - "Validate status enum values"
    depends: [usersTable]
    ownership_id: ENT-USER
risks:
  - "SQLite (dev) vs PostgreSQL (prod) divergence: uuid type handled differently -- SQLite uses text, Postgres uses native uuid; Drizzle abstraction must account for this"
  - "argon2id hash length varies by parameter choice; password_hash column must accommodate up to 256 chars"
  - "locked_until timestamp timezone handling: must store as UTC consistently across dev (SQLite) and prod (Postgres)"
  - "Migration tooling not yet specified; Drizzle Kit push vs migrate strategy needed before prod"
customer_approval:
  approved_by: auto
  approval_run_id: "run-2026-06-05-090859"
  approved_at: "2026-06-05T09:08:59Z"
---

# SDD-DATA-ENT-USER -- Data Schema Design for User Entity

## Architecture overview

The User entity is the foundational data model for the auth domain. Its schema is defined once in Drizzle ORM and serves as the single source of truth for:

- Database table structure (SQLite in dev, PostgreSQL in prod per PROJECT stack.db)
- Zod validation schemas (bidirectional Zod <-> JSON Schema per PROJECT stack rationale)
- TypeScript types (inferred from Drizzle schema)

All schema artifacts live in a single feature-folder location: `src/generated/auth/schema/`.

## Table definition

Table name: `users`

| Column | DB Type | Nullable | Default | Constraints | Source (ENT-USER field) |
|---|---|---|---|---|---|
| `id` | uuid (text on SQLite) | NOT NULL | `gen_random_uuid()` | PRIMARY KEY | `id` (uuid, pk) |
| `email` | varchar(255) | NOT NULL | -- | UNIQUE | `email` (string, unique, format: email) |
| `status` | varchar(20) | NOT NULL | `'active'` | CHECK (active, suspended) | `status` (enum) |
| `password_hash` | varchar(256) | NOT NULL | -- | -- | `password_hash` (string) |
| `failed_login_count` | integer | NOT NULL | `0` | -- | `failed_login_count` (integer, default: 0) |
| `locked_until` | timestamp | NULL | -- | -- | `locked_until` (timestamp, optional) |
| `created_at` | timestamp | NOT NULL | `now()` | -- | (audit field, standard) |
| `updated_at` | timestamp | NOT NULL | `now()` | -- | (audit field, standard) |

Notes:
- `created_at` and `updated_at` are standard audit columns not present in ENT-USER spec but required by convention for any persistent entity.
- `id` uses Drizzle's `uuid()` type which maps to `text` on SQLite and native `uuid` on PostgreSQL.

## Drizzle schema structure (pseudo)

```
// src/generated/auth/schema/users.table.ts
usersTable = pgTable('users', {
  id:                uuid('id').defaultRandom().primaryKey(),
  email:             varchar('email', { length: 255 }).notNull().unique(),
  status:            varchar('status', { length: 20 }).notNull().default('active'),
  passwordHash:      varchar('password_hash', { length: 256 }).notNull(),
  failedLoginCount:  integer('failed_login_count').notNull().default(0),
  lockedUntil:       timestamp('locked_until'),
  createdAt:         timestamp('created_at').notNull().defaultNow(),
  updatedAt:         timestamp('updated_at').notNull().defaultNow(),
})
```

## Zod schemas (derived)

```
// src/generated/auth/schema/users.zod.ts
// Inferred from Drizzle using createInsertSchema / createSelectSchema
insertUserSchema = createInsertSchema(usersTable, {
  email: z.string().email(),
  status: z.enum(['active', 'suspended']),
})

selectUserSchema = createSelectSchema(usersTable)
```

## Invariant enforcement

From ENT-USER spec `invariants`:

| Invariant | Enforcement layer | Mechanism |
|---|---|---|
| "email unique across system" | Database | UNIQUE constraint on `email` column |
| "status cannot transition suspended -> active without admin approval" | Service (AuthService) | Business logic check before status update |
| "failed_login_count resets to 0 after successful login" | Service (AuthService) | Reset in login success flow (see SDD-COMP-FEAT-AUTH) |

## Index strategy

| Index | Columns | Rationale |
|---|---|---|
| `users_pkey` | `id` | Primary key (auto) |
| `users_email_unique` | `email` | Login lookup by email; uniqueness enforcement |

No additional indexes needed for Phase 1 at 1000 RPS target. Monitor query performance and add indexes on `status` or `locked_until` if needed.

## Open questions

- **Soft delete**: ENT-USER spec does not mention soft delete. Current design uses hard delete. If soft delete is needed, add `deleted_at` nullable timestamp column.
- **Email case sensitivity**: Spec says "unique" but does not specify case handling. Recommend storing lowercase-normalized email and enforcing via Zod `.toLowerCase()` transform.
- **Timestamp precision**: SQLite timestamp precision differs from PostgreSQL. Drizzle handles this, but integration tests should verify behavior across both drivers.
