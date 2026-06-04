/**
 * CLI: `npx tsx src/keystone/cli/abort.ts [--purge] [--json]`
 *
 * Slash command `/keystone:abort`. Default: mark current run as `aborted`
 * so the file remains for forensics. `--purge` deletes the file entirely.
 *
 * Exit codes:
 *   0 — run aborted (or already terminal)
 *   3 — no active run found
 *   2 — script error
 */
import { fileURLToPath } from "node:url";
import {
  clearRunState,
  loadRunState,
  saveRunState,
} from "../orchestrator/store.js";
import { abort } from "../orchestrator/machine.js";
import type { RunState } from "../orchestrator/types.js";

export interface AbortCliOptions {
  purge: boolean;
  json: boolean;
  repoRoot: string;
}

export interface AbortCliResult {
  exitCode: 0 | 2 | 3;
  stdout: string;
  state?: RunState | null;
}

function parseArgs(argv: string[], repoRoot: string): AbortCliOptions {
  return {
    purge: argv.includes("--purge"),
    json: argv.includes("--json"),
    repoRoot,
  };
}

export function runAbortCli(opts: AbortCliOptions): AbortCliResult {
  try {
    const current = loadRunState(opts.repoRoot);
    if (!current) {
      return {
        exitCode: 3,
        stdout: "(no active run to abort)",
        state: null,
      };
    }

    if (opts.purge) {
      clearRunState(opts.repoRoot);
      return {
        exitCode: 0,
        stdout: opts.json
          ? JSON.stringify({ purged: true, run_id: current.run_id })
          : `purged run ${current.run_id}`,
        state: null,
      };
    }

    const next = abort(current);
    saveRunState(opts.repoRoot, next);
    return {
      exitCode: 0,
      stdout: opts.json
        ? JSON.stringify(next, null, 2)
        : `aborted run ${next.run_id} (was ${current.status} at ${current.current_station})`,
      state: next,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err);
    return { exitCode: 2, stdout: `abort error:\n${msg}` };
  }
}

const invoked = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (invoked) {
  const opts = parseArgs(process.argv.slice(2), process.cwd());
  const r = runAbortCli(opts);
  process.stdout.write(r.stdout + "\n");
  process.exit(r.exitCode);
}
