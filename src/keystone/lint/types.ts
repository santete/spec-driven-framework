/**
 * Shared Violation type for spec-lint (SR1–SR9) and intake-qc (IQ1–IQ8).
 * PRD §10.5 intake-report items + §10.8 feedback template share this shape.
 */
export type Severity = "blocker" | "warning" | "info";

export interface Violation {
  spec_path: string;
  id: string;
  /** Rule code: SR1..SR9, IQ1..IQ8, schema-validation, etc. */
  criterion: string;
  severity: Severity;
  field: string;
  message: string;
  suggestion?: string;
}
