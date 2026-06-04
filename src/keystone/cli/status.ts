/**
 * CLI: `npx tsx src/keystone/cli/status.ts [--json]`
 *
 * Slash command `/keystone:status` (PRD §18.5). Read-only — reports on
 * the current `.keystone/run-state.json` without mutating anything.
 *
 * Exit codes:
 *   0 — state found and rendered
 *   3 — no active run (file missing)
 *   2 — script error
 */
import { fileURLToPath } from "node:url";
import { loadRunState } from "../orchestrator/store.js";
import type { RunState } from "../orchestrator/types.js";
import { STATIONS } from "../orchestrator/types.js";

export interface StatusCliOptions {
  json: boolean;
  repoRoot: string;
}

export interface StatusCliResult {
  exitCode: 0 | 2 | 3;
  stdout: string;
  state?: RunState | null;
}

function parseArgs(argv: string[], repoRoot: string): StatusCliOptions {
  return { json: argv.includes("--json"), repoRoot };
}

function renderText(state: RunState): string {
  const lines: string[] = [];
  lines.push(`spec_change : ${state.spec_change_id}`);
  lines.push(`run_id      : ${state.run_id}`);
  lines.push(`status      : ${state.status}`);
  lines.push(`station     : ${state.current_station}`);
  lines.push(`started_at  : ${state.started_at}`);
  lines.push(`updated_at  : ${state.updated_at}`);
  if (state.input.title) lines.push(`title       : ${state.input.title}`);
  if (state.blocked_reason) lines.push(`blocked_reason: ${state.blocked_reason}`);
  lines.push("");
  lines.push("pipeline:");
  const byStation = new Map(state.history.map((h) => [h.station, h]));
  for (const s of STATIONS) {
    const h = byStation.get(s);
    const tag =
      h?.verdict === "pass"
        ? "✓"
        : h?.verdict === "skipped"
          ? "·"
          : h?.verdict === "reject"
            ? "✗"
            : h?.verdict === "blocked"
              ? "⏸"
              : s === state.current_station && state.status === "in_progress"
                ? "→"
                : " ";
    const msg = h?.message ?? (s === state.current_station ? "(pending)" : "");
    lines.push(`  ${tag} ${s}  ${msg}`);
  }
  if (state.last_report_path) {
    lines.push("");
    lines.push(`last_report: ${state.last_report_path}`);
  }
  const rg = state.rework_global;
  lines.push(`rework_global: ${rg.count}/${rg.k_global}`);
  return lines.join("\n");
}

export function runStatusCli(opts: StatusCliOptions): StatusCliResult {
  try {
    const state = loadRunState(opts.repoRoot);
    if (!state) {
      return {
        exitCode: 3,
        stdout: "(no active run — `.keystone/run-state.json` not found)",
        state: null,
      };
    }
    const stdout = opts.json ? JSON.stringify(state, null, 2) : renderText(state);
    return { exitCode: 0, stdout, state };
  } catch (err) {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err);
    return { exitCode: 2, stdout: `status error:\n${msg}` };
  }
}

const invoked = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (invoked) {
  const opts = parseArgs(process.argv.slice(2), process.cwd());
  const r = runStatusCli(opts);
  process.stdout.write(r.stdout + "\n");
  process.exit(r.exitCode);
}
