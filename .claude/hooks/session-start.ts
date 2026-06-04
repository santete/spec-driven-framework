/**
 * SessionStart hook — verify scaffolding exists, surface project context.
 *
 * PRD §7.2: SessionStart nạp index spec + ownership manifest + check
 * keystone_min_version (R11).
 *
 * Phase 0 M2: smoke check only — confirms key files present and warns if not.
 * Never blocks (exit 0 always), since SessionStart blocking would lock users out.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export interface SessionStartResult {
  exitCode: 0;
  stdout: string;
  missing: string[];
}

const REQUIRED_FILES = [
  "CLAUDE.md",
  "specs/spec-schema.json",
  "specs/project.md",
  ".trace/ownership.yaml",
];

export function runSessionStart(repoRoot: string): SessionStartResult {
  const missing: string[] = [];
  for (const rel of REQUIRED_FILES) {
    if (!existsSync(resolve(repoRoot, rel))) missing.push(rel);
  }
  const lines = ["[keystone] session start"];
  if (missing.length === 0) {
    lines.push("  scaffolding: OK (CLAUDE.md, spec-schema, project, ownership all present)");
  } else {
    lines.push(`  scaffolding: MISSING (${missing.length}) — ${missing.join(", ")}`);
    lines.push("  → Run Phase 0 M1 setup to restore.");
  }
  return { exitCode: 0, stdout: lines.join("\n"), missing };
}

import { fileURLToPath } from "node:url";
const invoked = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (invoked) {
  const result = runSessionStart(process.cwd());
  process.stdout.write(result.stdout + "\n");
  process.exit(result.exitCode);
}
