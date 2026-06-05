/**
 * S6 — Production: template-based code generation from specs + SDDs.
 * PRD §7.1 S6, gates G3 (impact resolved) + G4 (codegen complete).
 *
 * Phase 0 M4: generates trivially correct TypeScript:
 * - Entity → Drizzle schema + Zod validator
 * - Requirement → pure-function service + Vitest tests
 * All generated code is self-contained with no external I/O.
 */
import { resolve, dirname } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import YAML from "yaml";
import type { StationContext, StationOutcomeDraft } from "../orchestrator/stations.js";
import type {
  ImpactReport,
  ProductionReport,
  GeneratedFile,
  TraceIndex,
} from "./types.js";
import type { SpecFile } from "../types.js";
import { loadAllSpecs } from "../spec/loader.js";

// ── Provenance header ──────────────────────────────────────────────

function provenanceHeader(specId: string, specVersion: string, sddId: string, runId: string): string {
  return [
    `// @keystone-owner    ${specId}`,
    `// @spec-version      ${specVersion}`,
    `// @sdd-source        ${sddId}`,
    `// @generated-by      keystone@0.0.1`,
    `// @generated-at      ${new Date().toISOString()}`,
    `// @run-id            ${runId}`,
    "",
  ].join("\n");
}

// ── Entity codegen ────────────────────────────────────────────────

function generateEntitySchema(ent: SpecFile, runId: string): { path: string; content: string } {
  const fields = (ent.data.fields ?? []) as Array<Record<string, unknown>>;
  const header = provenanceHeader(ent.data.id, ent.data.version, `SDD-DATA-${ent.data.id}`, runId);

  const columnLines = fields.map((f) => {
    const name = String(f.name);
    const type = String(f.type);
    let col: string;
    switch (type) {
      case "uuid":
        col = `text("${name}")`;
        break;
      case "string":
        col = `text("${name}")`;
        break;
      case "integer":
        col = `integer("${name}")`;
        break;
      case "timestamp":
        col = `text("${name}")`;
        break;
      case "enum":
        col = `text("${name}")`;
        break;
      default:
        col = `text("${name}")`;
    }
    if (f.pk) col += `.primaryKey()`;
    if (f.required === false) col += ``; // nullable by default in Drizzle
    return `  ${name}: ${col},`;
  });

  const tableName = ent.data.title.toLowerCase().replace(/\s+/g, "_") + "s";
  const content = `${header}import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const ${tableName} = sqliteTable("${tableName}", {
${columnLines.join("\n")}
});
`;
  return { path: `src/generated/auth/entities/${ent.data.id.toLowerCase().replace(/-/g, "_")}.schema.ts`, content };
}

function generateEntityValidator(ent: SpecFile, runId: string): { path: string; content: string } {
  const fields = (ent.data.fields ?? []) as Array<Record<string, unknown>>;
  const header = provenanceHeader(ent.data.id, ent.data.version, `SDD-DATA-${ent.data.id}`, runId);

  const zodFields = fields.map((f) => {
    const name = String(f.name);
    const type = String(f.type);
    let z: string;
    switch (type) {
      case "uuid":
        z = "z.string().uuid()";
        break;
      case "string":
        z = "z.string()";
        break;
      case "integer":
        z = "z.number().int()";
        break;
      case "timestamp":
        z = "z.string().datetime().nullable()";
        break;
      case "enum": {
        const values = (f.values as string[]) ?? [];
        z = values.length > 0
          ? `z.enum([${values.map((v) => `"${v}"`).join(", ")}])`
          : "z.string()";
        break;
      }
      default:
        z = "z.string()";
    }
    if (f.required === false) z += ".optional()";
    return `  ${name}: ${z},`;
  });

  const schemaName = ent.data.title.replace(/\s+/g, "") + "Schema";
  const content = `${header}import { z } from "zod";

export const ${schemaName} = z.object({
${zodFields.join("\n")}
});

export type ${ent.data.title.replace(/\s+/g, "")} = z.infer<typeof ${schemaName}>;
`;
  return { path: `src/generated/auth/entities/${ent.data.id.toLowerCase().replace(/-/g, "_")}.validator.ts`, content };
}

// ── Requirement codegen ───────────────────────────────────────────

function generateService(req: SpecFile, runId: string): { path: string; content: string } {
  const header = provenanceHeader(req.data.id, req.data.version, `SDD-COMP-FEAT-AUTH`, runId);
  const acs = req.data.acceptance_criteria ?? [];

  // Generate a pure-function service based on ACs
  const content = `${header}/**
 * Auth service — generated from ${req.data.id} v${req.data.version}.
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
 * ${acs.map((ac) => `${ac.id}: given ${ac.given}, when ${ac.when}, then ${ac.then}`).join("\n * ")}
 */
export function verifyLogin(
  email: string,
  password: string,
  user: User | null,
  verifyHash: (hash: string, password: string) => boolean = () => true,
): LoginResult {
  if (!user) {
    return { success: false, error: "user_not_found", status_code: 401 };
  }

  if (user.status === "suspended") {
    return { success: false, error: "account_suspended", status_code: 403 };
  }

  // Check lockout (AC-AUTH-001-02)
  if (user.locked_until) {
    const lockExpiry = new Date(user.locked_until);
    if (lockExpiry > new Date()) {
      return { success: false, error: "account_locked", status_code: 429 };
    }
  }

  if (user.failed_login_count >= MAX_FAILED_ATTEMPTS) {
    return { success: false, error: "account_locked", status_code: 429 };
  }

  // Verify password (AC-AUTH-001-01)
  if (!verifyHash(user.password_hash, password)) {
    return { success: false, error: "invalid_credentials", status_code: 401 };
  }

  // Success — generate token
  const token = \`token_\${user.id}_\${Date.now()}\`;
  return { success: true, token, status_code: 200 };
}
`;
  const domain = req.data.id.toLowerCase().replace(/^req-/, "").replace(/-\d+$/, "");
  return { path: `src/generated/auth/services/auth.service.ts`, content };
}

// ── Test codegen ──────────────────────────────────────────────────

function generateTests(req: SpecFile, runId: string): { path: string; content: string } {
  const header = provenanceHeader(req.data.id, req.data.version, `SDD-COMP-FEAT-AUTH`, runId);

  const content = `${header}import { describe, it, expect } from "vitest";
import { verifyLogin } from "../../../src/generated/auth/services/auth.service.js";
import type { User } from "../../../src/generated/auth/services/auth.service.js";

const validUser: User = {
  id: "u1",
  email: "test@example.com",
  password_hash: "hashed_password",
  status: "active",
  failed_login_count: 0,
  locked_until: null,
};

describe("Auth Service — generated from ${req.data.id}", () => {
  // AC-AUTH-001-01: successful login
  it("returns token on valid credentials (AC-AUTH-001-01)", () => {
    const result = verifyLogin("test@example.com", "correct", validUser, () => true);
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.status_code).toBe(200);
  });

  it("returns 401 on invalid credentials", () => {
    const result = verifyLogin("test@example.com", "wrong", validUser, () => false);
    expect(result.success).toBe(false);
    expect(result.status_code).toBe(401);
  });

  it("returns 401 when user not found", () => {
    const result = verifyLogin("nobody@example.com", "pwd", null);
    expect(result.success).toBe(false);
    expect(result.status_code).toBe(401);
  });

  // AC-AUTH-001-02: lockout after 5 failed attempts
  it("returns 429 when failed_login_count >= 5 (AC-AUTH-001-02)", () => {
    const lockedUser: User = { ...validUser, failed_login_count: 5 };
    const result = verifyLogin("test@example.com", "any", lockedUser);
    expect(result.success).toBe(false);
    expect(result.status_code).toBe(429);
  });

  it("returns 403 when account suspended", () => {
    const suspendedUser: User = { ...validUser, status: "suspended" };
    const result = verifyLogin("test@example.com", "any", suspendedUser);
    expect(result.success).toBe(false);
    expect(result.status_code).toBe(403);
  });
});
`;
  return { path: `tests/generated/auth/auth.spec.ts`, content };
}

// ── Ownership update ──────────────────────────────────────────────

function updateOwnership(
  repoRoot: string,
  files: GeneratedFile[],
): void {
  const ownershipPath = resolve(repoRoot, ".trace", "ownership.yaml");
  const ownership: Record<string, string> = {};
  for (const f of files) {
    if (f.type === "implementation") {
      ownership[f.path] = f.owner_spec_id;
    }
  }

  const content = [
    "# File-ownership manifest — PRD §9.5.1, §10.2",
    "# Auto-generated by S6 production station.",
    "version: 1",
    `ownership:`,
    ...Object.entries(ownership).map(([path, id]) => `  "${path}": "${id}"`),
    "",
  ].join("\n");

  writeFileSync(ownershipPath, content, "utf8");
}

function updateTraceIndex(
  repoRoot: string,
  files: GeneratedFile[],
): void {
  const indexPath = resolve(repoRoot, ".trace", "index.json");
  if (!existsSync(indexPath)) return;

  const index: TraceIndex = JSON.parse(readFileSync(indexPath, "utf8"));

  for (const file of files) {
    const entry = index.entries.find((e) => e.spec_id === file.owner_spec_id);
    if (!entry) continue;
    if (file.type === "implementation" && !entry.implementations.includes(file.path)) {
      entry.implementations.push(file.path);
    } else if (file.type === "test" && !entry.tests.includes(file.path)) {
      entry.tests.push(file.path);
    }
  }

  writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n", "utf8");
}

// ── Handler ───────────────────────────────────────────────────────

export function s6Handler(ctx: StationContext): StationOutcomeDraft {
  const impactPath = resolve(ctx.repoRoot, ".keystone", "impact-report.json");
  if (!existsSync(impactPath)) {
    return { verdict: "reject", message: "S6: impact-report.json missing" };
  }
  const impact: ImpactReport = JSON.parse(readFileSync(impactPath, "utf8"));

  if (impact.affected_ids.length === 0) {
    const report: ProductionReport = { run_id: ctx.runId, generated_files: [], verdict: "pass" };
    const outDir = resolve(ctx.repoRoot, ".keystone");
    writeFileSync(resolve(outDir, "production-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
    return { verdict: "pass", message: "S6: No affected specs — skipping codegen.", report_path: ".keystone/production-report.json" };
  }

  const specs = loadAllSpecs(resolve(ctx.repoRoot, "specs"), ctx.repoRoot);
  const affectedSet = new Set(impact.affected_ids);

  const entSpecs = specs.filter((s) => s.data.type === "entity" && affectedSet.has(s.data.id));
  const reqSpecs = specs.filter((s) => s.data.type === "requirement" && affectedSet.has(s.data.id));

  const generatedFiles: GeneratedFile[] = [];

  // Generate entity files
  for (const ent of entSpecs) {
    const schema = generateEntitySchema(ent, ctx.runId);
    const validator = generateEntityValidator(ent, ctx.runId);

    for (const gen of [schema, validator]) {
      const absPath = resolve(ctx.repoRoot, gen.path);
      mkdirSync(dirname(absPath), { recursive: true });
      writeFileSync(absPath, gen.content, "utf8");
      generatedFiles.push({ path: gen.path, owner_spec_id: ent.data.id, type: "implementation" });
    }
  }

  // Generate requirement service + tests
  for (const req of reqSpecs) {
    const service = generateService(req, ctx.runId);
    const absPath = resolve(ctx.repoRoot, service.path);
    mkdirSync(dirname(absPath), { recursive: true });
    writeFileSync(absPath, service.content, "utf8");
    generatedFiles.push({ path: service.path, owner_spec_id: req.data.id, type: "implementation" });

    const tests = generateTests(req, ctx.runId);
    const testAbsPath = resolve(ctx.repoRoot, tests.path);
    mkdirSync(dirname(testAbsPath), { recursive: true });
    writeFileSync(testAbsPath, tests.content, "utf8");
    generatedFiles.push({ path: tests.path, owner_spec_id: req.data.id, type: "test" });
  }

  // Update ownership + trace index
  updateOwnership(ctx.repoRoot, generatedFiles);
  updateTraceIndex(ctx.repoRoot, generatedFiles);

  const report: ProductionReport = {
    run_id: ctx.runId,
    generated_files: generatedFiles,
    verdict: "pass",
  };

  const outDir = resolve(ctx.repoRoot, ".keystone");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    resolve(outDir, "production-report.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );

  return {
    verdict: "pass",
    message: `S6: ${generatedFiles.length} file(s) generated (${generatedFiles.filter((f) => f.type === "implementation").length} impl, ${generatedFiles.filter((f) => f.type === "test").length} test).`,
    report_path: ".keystone/production-report.json",
  };
}
