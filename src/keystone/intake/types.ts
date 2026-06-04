import type { Violation } from "../lint/types.js";

/**
 * Intake report — PRD §10.5 (`.keystone/intake-report.json`).
 *
 * Phase 0 M2 emits the minimal viable shape: header + items[].
 * (No `line` field yet — gray-matter does not track line numbers.)
 */
export type Verdict = "pass" | "reject";

export interface IntakeReport {
  $schema?: string;
  run_id: string;
  verdict: Verdict;
  summary: string;
  total_items: number;
  items: Violation[];
  next_action: string;
}
