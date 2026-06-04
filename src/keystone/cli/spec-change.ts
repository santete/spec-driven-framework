/**
 * CLI: `npx tsx src/keystone/cli/spec-change.ts --title "…" [--rationale "…"]
 *      [--spec path] [--json] [--dry-run]`
 *
 * Slash command `/spec-change` delegates to this script (PRD §7.3).
 *
 * Behavior:
 *   - Refuses to start if `.keystone/run-state.json` shows an `in_progress`
 *     or `blocked` run (must `/keystone:abort` or `/keystone:resume` first).
 *   - In dry-run mode: never writes run-state; just reports what the run
 *     WOULD produce when walked from S0 through done.
 *
 * Exit codes:
 *   0 — run completed with status=done
 *   1 — run halted with status=blocked | failed | aborted
 *   2 — script error / refuses to start
 */
import { fileURLToPath } from "node:url";
import { loadRunState, saveRunState } from "../orchestrator/store.js";
import { createRun } from "../orchestrator/machine.js";
import { runUntilHalt } from "../orchestrator/runner.js";
import type { RunState, SpecChangeInput } from "../orchestrator/types.js";

export interface SpecChangeCliOptions {
  title: string;
  rationale?: string;
  touchedSpecs: string[];
  json: boolean;
  dryRun: boolean;
  repoRoot: string;
}

export interface CliResult {
  exitCode: 0 | 1 | 2;
  stdout: string;
  state?: RunState;
}

export function parseArgs(argv: string[], repoRoot: string): SpecChangeCliOptions {
  const opts: SpecChangeCliOptions = {
    title: "",
    rationale: undefined,
    touchedSpecs: [],
    json: false,
    dryRun: false,
    repoRoot,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--title") opts.title = argv[++i] ?? "";
    else if (a === "--rationale") opts.rationale = argv[++i];
    else if (a === "--spec") opts.touchedSpecs.push(argv[++i] ?? "");
  }
  return opts;
}

function renderText(state: RunState): string {
  const lines: string[] = [];
  const tag =
    state.status === "done"
      ? "✓ DONE"
      : state.status === "blocked"
        ? "⏸ BLOCKED"
        : state.status === "failed"
          ? "✗ FAILED"
          : state.status === "aborted"
            ? "⊘ ABORTED"
            : "… IN PROGRESS";
  lines.push(`[${tag}] ${state.spec_change_id}  run_id=${state.run_id}`);
  lines.push(`current_station: ${state.current_station}`);
  if (state.blocked_reason) lines.push(`reason: ${state.blocked_reason}`);
  lines.push("");
  lines.push("history:");
  for (const h of state.history) {
    const v = h.verdict.padEnd(7);
    lines.push(`  ${h.station}  ${v}  ${h.message ?? ""}`);
  }
  if (state.last_report_path) {
    lines.push("");
    lines.push(`last_report: ${state.last_report_path}`);
  }
  return lines.join("\n");
}

export function runSpecChangeCli(opts: SpecChangeCliOptions): CliResult {
  try {
    if (!opts.title.trim()) {
      return {
        exitCode: 2,
        stdout: "spec-change error: --title is required",
      };
    }

    const existing = loadRunState(opts.repoRoot);
    if (existing && (existing.status === "in_progress" || existing.status === "blocked")) {
      return {
        exitCode: 2,
        stdout:
          `spec-change refused: active run ${existing.run_id} ` +
          `(status=${existing.status}, station=${existing.current_station}). ` +
          `Use /keystone:resume or /keystone:abort first.`,
      };
    }

    const input: SpecChangeInput = {
      title: opts.title,
      rationale: opts.rationale,
      touched_specs: opts.touchedSpecs.length ? opts.touchedSpecs : undefined,
    };
    const initial = createRun({ input });
    const finalState = runUntilHalt(initial, { repoRoot: opts.repoRoot });

    if (!opts.dryRun) saveRunState(opts.repoRoot, finalState);

    const stdout = opts.json
      ? JSON.stringify(finalState, null, 2)
      : renderText(finalState);
    const exit = finalState.status === "done" ? 0 : 1;
    return { exitCode: exit, stdout, state: finalState };
  } catch (err) {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err);
    return { exitCode: 2, stdout: `spec-change error:\n${msg}` };
  }
}

const invoked = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (invoked) {
  const opts = parseArgs(process.argv.slice(2), process.cwd());
  const r = runSpecChangeCli(opts);
  process.stdout.write(r.stdout + "\n");
  process.exit(r.exitCode);
}
