/**
 * Orchestrator runner: executes one or more stations against a RunState.
 *
 * Single-tick (`runTick`) executes whichever station `current_station`
 * points at, records the outcome, and returns the new state. Run-to-end
 * (`runUntilHalt`) loops until the state hits a non-`in_progress` status.
 *
 * No persistence here — callers (CLI) handle load/save via store.ts.
 */
import { recordOutcome } from "./machine.js";
import { STATION_HANDLERS, type StationContext } from "./stations.js";
import type { RunState } from "./types.js";

export interface RunnerOptions {
  repoRoot: string;
  /**
   * Safety stop for `runUntilHalt` to prevent runaway loops in case a future
   * station handler returns a verdict that doesn't progress the machine.
   * Default 32 is well above the 9 stations × 5 reworks max.
   */
  maxTicks?: number;
  now?: () => Date;
}

export function runTick(state: RunState, opts: RunnerOptions): RunState {
  if (state.status !== "in_progress") return state;
  const now = opts.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const handler = STATION_HANDLERS[state.current_station];

  const ctx: StationContext = {
    repoRoot: opts.repoRoot,
    runId: state.run_id,
    specChangeId: state.spec_change_id,
  };

  let draft;
  try {
    draft = handler(ctx);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    draft = {
      verdict: "reject" as const,
      message: `Station ${state.current_station} threw: ${msg}`,
    };
  }

  return recordOutcome(
    state,
    {
      started_at: startedAt,
      ended_at: now().toISOString(),
      verdict: draft.verdict,
      message: draft.message,
      report_path: draft.report_path,
    },
    now(),
  );
}

export function runUntilHalt(state: RunState, opts: RunnerOptions): RunState {
  let s = state;
  const limit = opts.maxTicks ?? 32;
  for (let i = 0; i < limit; i++) {
    if (s.status !== "in_progress") return s;
    s = runTick(s, opts);
  }
  return s;
}
