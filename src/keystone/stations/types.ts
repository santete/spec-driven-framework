/**
 * Shared types for station S1–S8 outputs.
 * Each station writes a JSON report to `.keystone/` and returns a StationOutcomeDraft.
 */

// ── S1: Spec Graph ────────────────────────────────────────────────────

export interface SpecGraphNode {
  id: string;
  type: string;
  version: string;
  specPath: string;
}

export interface SpecGraphEdge {
  from: string;
  to: string;
  relation: string; // refines | depends_on | satisfies | verifies | supersedes
}

export interface SpecGraph {
  nodes: SpecGraphNode[];
  edges: SpecGraphEdge[];
  topologicalOrder: string[];
}

// ── S2: Trace Index ───────────────────────────────────────────────────

export interface TraceEntry {
  spec_id: string;
  spec_path: string;
  spec_version: string;
  spec_content_hash: string;
  implementations: string[];
  tests: string[];
  last_run_id: string;
}

export interface TraceIndex {
  version: 1;
  entries: TraceEntry[];
}

export interface TraceReport {
  run_id: string;
  created: number;
  updated: number;
  total: number;
}

// ── S3: Governance ────────────────────────────────────────────────────

export interface GovernanceReport {
  run_id: string;
  lint_violations: number;
  lint_blockers: number;
  adr_required: boolean;
  adr_present: boolean;
  semver_ok: boolean;
  verdict: "pass" | "reject";
}

// ── S4: Impact Analysis ──────────────────────────────────────────────

export type ChangeOp = "added" | "modified" | "removed";
export type ChangeClassification = "additive" | "breaking" | "cosmetic";

export interface FieldDiff {
  field: string;
  action: "added" | "removed" | "changed";
  old_value?: unknown;
  new_value?: unknown;
}

export interface SpecChange {
  id: string;
  op: ChangeOp;
  spec_path: string;
  hash: string;
  /** Per-change classification (field-level analysis) */
  change_classification?: ChangeClassification;
  /** Field-level diffs (only for op=modified) */
  field_diffs?: FieldDiff[];
}

export interface ImpactReport {
  run_id: string;
  classification: ChangeClassification;
  changes: SpecChange[];
  affected_ids: string[];
  required_actions: Array<{ id: string; action: string }>;
}

export interface BaselineSpecs {
  version: 1;
  hashes: Record<string, string>;
  /** Full frontmatter stored for field-level diff on next run */
  frontmatter?: Record<string, Record<string, unknown>>;
}

// ── S5: SDD Design ───────────────────────────────────────────────────

export interface SddEntry {
  id: string;
  spec_ids_covered: string[];
  file_path: string;
  status: "approved";
}

export interface SddReport {
  run_id: string;
  sdds: SddEntry[];
  verdict: "pass" | "reject";
}

// ── S6: Production ───────────────────────────────────────────────────

export interface GeneratedFile {
  path: string;        // repo-relative
  owner_spec_id: string;
  type: "implementation" | "test";
}

export interface ProductionReport {
  run_id: string;
  generated_files: GeneratedFile[];
  verdict: "pass" | "reject";
}

// ── S7: Verification ─────────────────────────────────────────────────

export interface GateResult {
  gate_id: string;
  status: "pass" | "fail";
  message: string;
}

export interface VerificationReport {
  run_id: string;
  gates: GateResult[];
  verdict: "pass" | "reject";
}

// ── S8: Delivery ─────────────────────────────────────────────────────

export interface DeliveryReport {
  run_id: string;
  classification: ChangeClassification;
  commit_sha: string | null;
  gates_checked: string[];
  verdict: "pass" | "reject";
}
