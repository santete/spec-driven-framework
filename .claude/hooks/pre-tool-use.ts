/**
 * PreToolUse hook — block Write/Edit/MultiEdit into protected (derived) paths.
 *
 * PRD §7.2 + §9.5.1: code dẫn xuất + runtime state files do máy sinh, không được sửa
 * tay ngoài luồng pipeline. Cưỡng chế qua exit code 2 (chặn tool call).
 *
 * Test fixture pattern (HR1, PRD §15.3):
 *   input event mock → runPreToolUse(input) → assert { exitCode, stderr }.
 */

const PROTECTED_PREFIXES = [
  "src/generated/",
  "tests/generated/",
  "tests/adversarial/",
];

const PROTECTED_EXACT = new Set([
  ".trace/index.json",
  ".trace/retired.json",
  ".keystone/run-state.json",
  ".keystone/rework-log.json",
  ".keystone/diff-log.json",
  ".keystone/intake-report.json",
  ".keystone/sdd-review-thread.json",
  ".keystone/manual-actions.log",
  ".keystone/bypass.log",
]);

const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit"]);

export interface PreToolUseInput {
  tool_name?: string;
  tool_input?: { file_path?: string; [k: string]: unknown };
  [k: string]: unknown;
}

export interface HookResult {
  exitCode: 0 | 2;
  stderr?: string;
}

/** Normalize Windows / absolute paths to forward-slash relative form for matching. */
export function normalizePath(filePath: string, repoRoot?: string): string {
  let p = filePath.replace(/\\/g, "/");
  if (repoRoot) {
    const root = repoRoot.replace(/\\/g, "/").replace(/\/$/, "");
    if (p.startsWith(root + "/")) p = p.slice(root.length + 1);
  }
  return p.replace(/^\.\//, "");
}

export function isProtected(filePath: string, repoRoot?: string): boolean {
  const norm = normalizePath(filePath, repoRoot);
  if (PROTECTED_EXACT.has(norm)) return true;
  return PROTECTED_PREFIXES.some((prefix) => norm.startsWith(prefix));
}

export function runPreToolUse(
  input: PreToolUseInput,
  repoRoot?: string,
): HookResult {
  const tool = input.tool_name;
  if (!tool || !WRITE_TOOLS.has(tool)) return { exitCode: 0 };
  const fp = input.tool_input?.file_path;
  if (typeof fp !== "string" || fp.length === 0) return { exitCode: 0 };
  if (!isProtected(fp, repoRoot)) return { exitCode: 0 };

  const rel = normalizePath(fp, repoRoot);
  return {
    exitCode: 2,
    stderr:
      `[keystone] Blocked ${tool} on '${rel}'\n` +
      `  Reason: Đây là artifact dẫn xuất / runtime state. Sửa tay ngoài luồng vi phạm\n` +
      `  PRD §7.2 + §9.5.1. Đường đúng: kích /spec-change → pipeline tự tái sinh.\n` +
      `  Escape hatch: \`keystone bypass --reason <ADR-DRAFT-ID>\` (PRD §9.7 FR-ESC-01).`,
  };
}

import { fileURLToPath } from "node:url";
const invoked = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (invoked) {
  let raw = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) raw += chunk;
  let parsed: PreToolUseInput = {};
  try {
    parsed = raw.trim().length === 0 ? {} : (JSON.parse(raw) as PreToolUseInput);
  } catch {
    // malformed input — fail open (don't block), but log
    process.stderr.write("[keystone pre-tool-use] malformed stdin, skipping\n");
    process.exit(0);
  }
  const result = runPreToolUse(parsed, process.cwd());
  if (result.stderr) process.stderr.write(result.stderr + "\n");
  process.exit(result.exitCode);
}
