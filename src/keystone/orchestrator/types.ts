/**
 * Orchestrator runtime state — PRD §7.3 (`/spec-change` state machine)
 * and §10.5 (`.keystone/run-state.json`).
 *
 * Phase 0 M3 keeps the shape minimal but forward-compatible:
 *   - 9 stations S0–S8 + terminal `done` / `aborted` / `failed`
 *   - per-station history with verdict + ended_at
 *   - rework counters (k_self per station, k_global aggregate)
 *
 * Mutations only via pure functions in `machine.ts` so tests are deterministic.
 */
export type StationId =
  | "S0"
  | "S1"
  | "S2"
  | "S3"
  | "S4"
  | "S5"
  | "S6"
  | "S7"
  | "S8";

export const STATIONS: readonly StationId[] = [
  "S0",
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
  "S7",
  "S8",
] as const;

export type RunStatus =
  | "in_progress"
  | "blocked"
  | "done"
  | "aborted"
  | "failed";

export type StationVerdict = "pass" | "reject" | "skipped" | "blocked";

export interface StationOutcome {
  station: StationId;
  started_at: string;
  ended_at: string;
  verdict: StationVerdict;
  report_path?: string;
  /** Free-form message (PRD recommends ≤ 280 chars). */
  message?: string;
}

export interface ReworkCounter {
  /** Times this station has been re-entered for this run. */
  count: number;
  /** Max self-reworks allowed (from PROJECT.rework.k_self or default). */
  k_self: number;
}

export interface SpecChangeInput {
  title: string;
  rationale?: string;
  /** Repo-relative paths of specs being introduced/modified. */
  touched_specs?: string[];
}

export interface RunState {
  $schema?: string;
  run_id: string;
  spec_change_id: string;
  started_at: string;
  updated_at: string;
  /** The station to execute on next tick. For terminal status this is the last one. */
  current_station: StationId;
  status: RunStatus;
  input: SpecChangeInput;
  history: StationOutcome[];
  rework: Partial<Record<StationId, ReworkCounter>>;
  /** Aggregate counter for k_global enforcement (PRD §11). */
  rework_global: { count: number; k_global: number };
  /** Most recent station report file (e.g., `.keystone/intake-report.json`). */
  last_report_path?: string;
  /** Set when status=blocked — reason to surface in `/keystone:status`. */
  blocked_reason?: string;
}
