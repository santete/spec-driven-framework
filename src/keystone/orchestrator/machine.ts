/**
 * Pure state-machine transitions for the `/spec-change` orchestrator.
 *
 * All functions take a RunState (or partial input) and return a NEW RunState.
 * No I/O — that lives in `store.ts` / `runner.ts`. This makes the machine
 * trivially testable and deterministic per PRD §7.3.
 */
import type {
  RunState,
  RunStatus,
  StationId,
  StationOutcome,
  StationVerdict,
  SpecChangeInput,
  ReworkCounter,
} from "./types.js";
import { STATIONS } from "./types.js";

const DEFAULT_K_SELF = 5;
const DEFAULT_K_GLOBAL = 5;

export interface ProjectReworkConfig {
  k_global?: number;
  k_self?: Partial<Record<StationId, number>>;
}

export function generateRunId(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
  const time = `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  return `run-${stamp}-${time}`;
}

export function generateSpecChangeId(now: Date = new Date(), seq = 1): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
  return `SC-${stamp}-${String(seq).padStart(3, "0")}`;
}

/** Create a fresh run, starting at S0. */
export function createRun(args: {
  input: SpecChangeInput;
  now?: Date;
  rework?: ProjectReworkConfig;
  runId?: string;
  specChangeId?: string;
}): RunState {
  const now = args.now ?? new Date();
  const iso = now.toISOString();
  const k_global = args.rework?.k_global ?? DEFAULT_K_GLOBAL;

  const rework: Partial<Record<StationId, ReworkCounter>> = {};
  for (const s of STATIONS) {
    rework[s] = {
      count: 0,
      k_self: args.rework?.k_self?.[s] ?? DEFAULT_K_SELF,
    };
  }

  return {
    $schema: ".keystone/run-state-schema.json",
    run_id: args.runId ?? generateRunId(now),
    spec_change_id: args.specChangeId ?? generateSpecChangeId(now),
    started_at: iso,
    updated_at: iso,
    current_station: "S0",
    status: "in_progress",
    input: args.input,
    history: [],
    rework,
    rework_global: { count: 0, k_global },
  };
}

export function nextStation(s: StationId): StationId | null {
  const i = STATIONS.indexOf(s);
  return i >= 0 && i + 1 < STATIONS.length ? STATIONS[i + 1] : null;
}

export function isTerminal(status: RunStatus): boolean {
  return status === "done" || status === "aborted" || status === "failed";
}

/**
 * Record the result of executing `current_station` and advance.
 *
 * Verdict semantics:
 *   - pass:    advance to next station (or `done` if S8)
 *   - reject:  bump rework counters; if budgets blown → `failed`, else stay
 *   - blocked: pause run in `blocked` status (caller fills `blocked_reason`)
 *   - skipped: advance without bumping rework (Phase 0 stub behavior)
 */
export function recordOutcome(
  state: RunState,
  outcome: Omit<StationOutcome, "station">,
  now: Date = new Date(),
): RunState {
  if (isTerminal(state.status)) return state;

  const station = state.current_station;
  const fullOutcome: StationOutcome = { station, ...outcome };
  const history = [...state.history, fullOutcome];
  const updated_at = now.toISOString();
  const last_report_path = outcome.report_path ?? state.last_report_path;

  const next: RunState = {
    ...state,
    history,
    updated_at,
    last_report_path,
  };

  switch (outcome.verdict satisfies StationVerdict) {
    case "pass":
    case "skipped": {
      const nxt = nextStation(station);
      if (!nxt) {
        return { ...next, status: "done" };
      }
      return { ...next, current_station: nxt };
    }
    case "blocked": {
      return {
        ...next,
        status: "blocked",
        blocked_reason: outcome.message ?? `Station ${station} blocked`,
      };
    }
    case "reject": {
      const self = next.rework[station] ?? { count: 0, k_self: DEFAULT_K_SELF };
      const bumpedSelf: ReworkCounter = { ...self, count: self.count + 1 };
      const bumpedGlobal = {
        ...next.rework_global,
        count: next.rework_global.count + 1,
      };
      const selfBlown = bumpedSelf.count > bumpedSelf.k_self;
      const globalBlown = bumpedGlobal.count > bumpedGlobal.k_global;
      return {
        ...next,
        rework: { ...next.rework, [station]: bumpedSelf },
        rework_global: bumpedGlobal,
        status: selfBlown || globalBlown ? "failed" : "in_progress",
        blocked_reason:
          selfBlown || globalBlown
            ? `Rework budget exceeded at ${station} (self=${bumpedSelf.count}/${bumpedSelf.k_self}, global=${bumpedGlobal.count}/${bumpedGlobal.k_global})`
            : undefined,
      };
    }
  }
}

/** Unblock a paused run so the next tick re-executes the same station. */
export function resume(state: RunState, now: Date = new Date()): RunState {
  if (state.status !== "blocked") return state;
  return {
    ...state,
    status: "in_progress",
    blocked_reason: undefined,
    updated_at: now.toISOString(),
  };
}

export function abort(state: RunState, now: Date = new Date()): RunState {
  if (isTerminal(state.status)) return state;
  return { ...state, status: "aborted", updated_at: now.toISOString() };
}
