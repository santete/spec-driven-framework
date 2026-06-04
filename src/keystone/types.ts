/**
 * Core types for Keystone spec artifacts.
 * PRD §8.2 — frontmatter shape per artifact type.
 *
 * Phase 0 keeps types loose (Record<string, unknown> for unknown extensions)
 * because Ajv handles strict validation; TS types are for ergonomics only.
 */

export type ArtifactType =
  | "entity"
  | "feature"
  | "requirement"
  | "nfr"
  | "api"
  | "schema"
  | "ac"
  | "project"
  | "sdd";

export type Status =
  | "draft"
  | "approved"
  | "deprecated"
  | "retired"
  | "proposed"
  | "rejected"
  | "superseded";

export type Priority = "must" | "should" | "could";

export interface Relations {
  refines?: string[];
  depends_on?: string[];
  satisfies?: string[];
  verifies?: string[];
  supersedes?: string[];
}

export interface AcceptanceCriterion {
  id: string;
  given: string;
  when: string;
  then: string;
}

export interface SpecFrontmatter {
  id: string;
  type: ArtifactType;
  title: string;
  version: string;
  status?: Status;
  priority?: Priority;
  owner?: string;
  created?: string;
  updated?: string;
  tags?: string[];
  relations?: Relations;
  fields?: Array<Record<string, unknown>>;
  invariants?: string[];
  acceptance_criteria?: AcceptanceCriterion[];
  budget?: { metric: string; threshold: number; measured_by: string };
  openapi?: Record<string, unknown>;
  openapi_ref?: string;
  openapi_path?: string;
  openapi_method?: string;
  json_schema?: Record<string, unknown>;
  profile?: string;
  profile_source?: "catalog" | "custom_repo";
  custom_profile?: Record<string, unknown>;
  stack?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  non_functional_defaults?: Record<string, unknown>;
  codegen_conventions?: Record<string, unknown>;
  feedback_style?: "concise" | "detailed" | "coaching";
  rework?: Record<string, unknown>;
  derived_from?: Record<string, unknown>;
  components?: Array<Record<string, unknown>>;
  sequencing?: string[];
  risks?: string[];
  open_questions?: unknown[];
  customer_approval?: Record<string, unknown>;
  [extra: string]: unknown;
}

/** A loaded spec file: parsed frontmatter + raw body + path. */
export interface SpecFile {
  /** absolute path */
  path: string;
  /** path relative to repo root, forward slashes */
  relPath: string;
  data: SpecFrontmatter;
  body: string;
  /** raw file contents (for regex scans like IQ2 TBD/TODO) */
  raw: string;
}
