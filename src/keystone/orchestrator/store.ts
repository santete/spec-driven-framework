/**
 * Run-state persistence — `.keystone/run-state.json` (PRD §10.5).
 *
 * The file is machine-owned: hooks (PreToolUse) block manual edits.
 * Always write via `saveRunState` so we get atomic rename + pretty JSON.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import type { RunState } from "./types.js";

export const RUN_STATE_REL = ".keystone/run-state.json";

export function runStatePath(repoRoot: string): string {
  return resolve(repoRoot, RUN_STATE_REL);
}

export function loadRunState(repoRoot: string): RunState | null {
  const p = runStatePath(repoRoot);
  if (!existsSync(p)) return null;
  const raw = readFileSync(p, "utf8");
  return JSON.parse(raw) as RunState;
}

/**
 * Atomic-ish write: stage to `*.tmp`, then rename. Renames are atomic on
 * the same filesystem on Windows + POSIX, so concurrent readers never see
 * a half-written file.
 */
export function saveRunState(repoRoot: string, state: RunState): void {
  const p = runStatePath(repoRoot);
  mkdirSync(dirname(p), { recursive: true });
  const tmp = `${p}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n", "utf8");
  renameSync(tmp, p);
}

export function clearRunState(repoRoot: string): boolean {
  const p = runStatePath(repoRoot);
  if (!existsSync(p)) return false;
  unlinkSync(p);
  return true;
}
