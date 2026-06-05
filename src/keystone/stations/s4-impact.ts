/**
 * S4 — Impact Analysis: semantic diff + field-level classification.
 * PRD §7.1 S4, §8.5 classification table.
 *
 * Phase 1: field-level diff of spec frontmatter.
 * Classification rules (simplified from PRD §8.5):
 *   - added spec = additive
 *   - removed spec = breaking
 *   - modified spec: depends on which fields changed:
 *     - title/owner/tags only = cosmetic
 *     - new optional field / new AC / new relation = additive
 *     - required field removed / AC removed / field type narrowed = breaking
 */
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import type { StationContext, StationOutcomeDraft } from "../orchestrator/stations.js";
import type {
  ImpactReport,
  BaselineSpecs,
  SpecChange,
  ChangeClassification,
  FieldDiff,
} from "./types.js";
import { loadAllSpecs } from "../spec/loader.js";

function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex").slice(0, 16);
}

// ── Field-level diff ──────────────────────────────────────────────

/** Cosmetic fields — changes here never affect code generation */
const COSMETIC_FIELDS = new Set([
  "title", "owner", "tags", "created", "updated", "feedback_style",
]);

/** Breaking operations — removing or narrowing these fields = breaking */
const STRUCTURAL_FIELDS = new Set([
  "fields", "acceptance_criteria", "invariants", "priority",
  "openapi", "json_schema", "budget", "components",
]);

function diffFrontmatter(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    if (key === "$schema") continue;
    const oldVal = oldData[key];
    const newVal = newData[key];

    if (oldVal === undefined && newVal !== undefined) {
      diffs.push({ field: key, action: "added", new_value: summarize(newVal) });
    } else if (oldVal !== undefined && newVal === undefined) {
      diffs.push({ field: key, action: "removed", old_value: summarize(oldVal) });
    } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({ field: key, action: "changed", old_value: summarize(oldVal), new_value: summarize(newVal) });
    }
  }

  return diffs;
}

/** Summarize a value for the diff report (avoid huge objects) */
function summarize(val: unknown): unknown {
  if (Array.isArray(val)) return `[${val.length} items]`;
  if (typeof val === "object" && val !== null) return `{${Object.keys(val).join(", ")}}`;
  return val;
}

function classifyFieldDiffs(diffs: FieldDiff[]): ChangeClassification {
  if (diffs.length === 0) return "cosmetic";

  let hasBreaking = false;
  let hasAdditive = false;
  let hasCosmeticOnly = true;

  for (const diff of diffs) {
    if (COSMETIC_FIELDS.has(diff.field)) {
      // cosmetic — doesn't upgrade classification
      continue;
    }

    hasCosmeticOnly = false;

    if (diff.action === "removed" && STRUCTURAL_FIELDS.has(diff.field)) {
      hasBreaking = true;
    } else if (diff.action === "changed" && STRUCTURAL_FIELDS.has(diff.field)) {
      // Changed structural field: could be additive (added item) or breaking (removed item)
      // Simplified: treat as additive unless we can prove it's breaking
      hasAdditive = true;
    } else if (diff.action === "added") {
      hasAdditive = true;
    } else if (diff.action === "removed") {
      // Non-structural field removed = additive (relaxing constraint)
      hasAdditive = true;
    } else {
      hasAdditive = true;
    }
  }

  if (hasBreaking) return "breaking";
  if (hasCosmeticOnly && !hasAdditive) return "cosmetic";
  return "additive";
}

// ── Impact computation ────────────────────────────────────────────

export function computeImpact(
  specs: Array<{ data: Record<string, unknown> & { id: string; type: string }; relPath: string; raw: string }>,
  baseline: BaselineSpecs | null,
  runId: string,
): { report: ImpactReport; newBaseline: BaselineSpecs } {
  const changes: SpecChange[] = [];
  const newHashes: Record<string, string> = {};
  const newFrontmatter: Record<string, Record<string, unknown>> = {};

  for (const spec of specs) {
    const hash = hashContent(spec.raw);
    newHashes[spec.data.id] = hash;
    newFrontmatter[spec.data.id] = { ...spec.data };
    const oldHash = baseline?.hashes[spec.data.id];

    if (!oldHash) {
      changes.push({
        id: spec.data.id, op: "added", spec_path: spec.relPath, hash,
        change_classification: "additive",
      });
    } else if (oldHash !== hash) {
      // Field-level diff
      const oldFm = baseline?.frontmatter?.[spec.data.id] ?? {};
      const fieldDiffs = diffFrontmatter(oldFm, spec.data);
      const changeClass = classifyFieldDiffs(fieldDiffs);

      changes.push({
        id: spec.data.id, op: "modified", spec_path: spec.relPath, hash,
        change_classification: changeClass,
        field_diffs: fieldDiffs,
      });
    }
  }

  // Removed specs
  if (baseline) {
    for (const id of Object.keys(baseline.hashes)) {
      if (!newHashes[id]) {
        changes.push({
          id, op: "removed", spec_path: "", hash: "",
          change_classification: "breaking",
        });
      }
    }
  }

  // Aggregate classification: worst of all changes
  let classification: ChangeClassification = "cosmetic";
  for (const c of changes) {
    const cc = c.change_classification ?? "additive";
    if (cc === "breaking") { classification = "breaking"; break; }
    if (cc === "additive") classification = "additive";
  }

  const affected_ids = changes.map((c) => c.id);
  const required_actions = changes
    .filter((c) => c.op !== "removed")
    .map((c) => ({
      id: c.id,
      action: c.op === "added" ? "generate" : "regenerate",
    }));

  return {
    report: { run_id: runId, classification, changes, affected_ids, required_actions },
    newBaseline: { version: 1, hashes: newHashes, frontmatter: newFrontmatter },
  };
}

// ── Handler ───────────────────────────────────────────────────────

export function s4Handler(ctx: StationContext): StationOutcomeDraft {
  const specs = loadAllSpecs(resolve(ctx.repoRoot, "specs"), ctx.repoRoot);

  const baselinePath = resolve(ctx.repoRoot, ".keystone", "baseline-specs.json");
  let baseline: BaselineSpecs | null = null;
  if (existsSync(baselinePath)) {
    try {
      baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
    } catch { /* corrupted → no baseline */ }
  }

  const { report, newBaseline } = computeImpact(specs, baseline, ctx.runId);

  const outDir = resolve(ctx.repoRoot, ".keystone");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "impact-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  writeFileSync(resolve(outDir, "baseline-specs.json"), JSON.stringify(newBaseline, null, 2) + "\n", "utf8");

  if (report.affected_ids.length === 0) {
    return { verdict: "pass", message: "S4: No changes detected.", report_path: ".keystone/impact-report.json" };
  }

  const fieldDiffCount = report.changes.reduce((n, c) => n + (c.field_diffs?.length ?? 0), 0);
  const detail = fieldDiffCount > 0 ? `, ${fieldDiffCount} field diff(s)` : "";

  return {
    verdict: "pass",
    message: `S4: ${report.changes.length} change(s), classification=${report.classification}, ${report.affected_ids.length} affected${detail}.`,
    report_path: ".keystone/impact-report.json",
  };
}
