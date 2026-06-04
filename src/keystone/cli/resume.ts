/**
 * CLI: `npx tsx src/keystone/cli/resume.ts [--json]`
 *
 * Slash command `/keystone:resume`. Re-enters a paused run at its
 * `current_station` and drives the orchestrator until halt.
 *
 * Exit codes:
 *   0 — run completed (status=done)
 *   1 — still halted (blocked again, failed, or aborted)
 *   2 — script error or nothing to resume
 *   3 — no active run found
 */
import { fileURLToPath } from "node:url";
import { loadRunState, saveRunState } from "../orchestrator/store.js";
import { resume } from "../orchestrator/machine.js";
import { runUntilHalt } from "../orchestrator/runner.js";
import type { RunState } from "../orchestrator/types.js";

export interface ResumeCliOptions {
  json: boolean;
  repoRoot: string;
}

export interface ResumeCliResult {
  exitCode: 0 | 1 | 2 | 3;
  stdout: string;
  state?: RunState | null;
}

function parseArgs(argv: string[], repoRoot: string): ResumeCliOptions {
  return { json: argv.includes("--json"), repoRoot };
}

function renderText(state: RunState): string {
  const lines: string[] = [];
  lines.push(`[${state.status.toUpperCase()}] ${state.spec_change_id}`);
  lines.push(`current_station: ${state.current_station}`);
  if (state.blocked_reason) lines.push(`reason: ${state.blocked_reason}`);
  return lines.join("\n");
}

export function runResumeCli(opts: ResumeCliOptions): ResumeCliResult {
  try {
    const current = loadRunState(opts.repoRoot);
    if (!current) {
      return {
        exitCode: 3,
        stdout: "(no active run to resume)",
        state: null,
      };
    }
    if (current.status === "done" || current.status === "aborted" || current.status === "failed") {
      return {
        exitCode: 2,
        stdout: `cannot resume: run is terminal (status=${current.status})`,
        state: current,
      };
    }

    const unblocked = current.status === "blocked" ? resume(current) : current;
    const finalState = runUntilHalt(unblocked, { repoRoot: opts.repoRoot });
    saveRunState(opts.repoRoot, finalState);

    const stdout = opts.json
      ? JSON.stringify(finalState, null, 2)
      : renderText(finalState);
    const exit = finalState.status === "done" ? 0 : 1;
    return { exitCode: exit, stdout, state: finalState };
  } catch (err) {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err);
    return { exitCode: 2, stdout: `resume error:\n${msg}` };
  }
}

const invoked = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (invoked) {
  const opts = parseArgs(process.argv.slice(2), process.cwd());
  const r = runResumeCli(opts);
  process.stdout.write(r.stdout + "\n");
  process.exit(r.exitCode);
}
