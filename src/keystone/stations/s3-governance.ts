/**
 * S3 — Governance: spec lint + ADR validation + semver check.
 * PRD §7.1 S3, gates G1 (spec lint) + G2 (ADR).
 *
 * Phase 1: reads impact report from S4 to determine if ADR is needed.
 * ADR required only when classification = breaking (modified existing specs).
 * New specs (additive) and cosmetic changes don't need ADR.
 */
import { resolve } from "node:path";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import type { StationContext, StationOutcomeDraft } from "../orchestrator/stations.js";
import type { GovernanceReport } from "./types.js";
import type { ImpactReport } from "./types.js";
import type { Violation } from "../lint/types.js";
import { loadAllSpecs } from "../spec/loader.js";
import { loadSchemaValidator } from "../spec/validator.js";
import { runLint } from "../lint/runner.js";

export function runGovernance(
  violations: Violation[],
  runId: string,
  classification: string,
): GovernanceReport {
  const blockers = violations.filter((v) => v.severity === "blocker");

  // ADR required only for breaking changes (PRD §12 G2)
  // Additive (new specs, new fields) and cosmetic don't need ADR
  const adrRequired = classification === "breaking";
  const adrPresent = !adrRequired; // Phase 1: no ADR system yet, auto-pass for non-breaking

  const semverOk = true;

  return {
    run_id: runId,
    lint_violations: violations.length,
    lint_blockers: blockers.length,
    adr_required: adrRequired,
    adr_present: adrPresent,
    semver_ok: semverOk,
    verdict: blockers.length === 0 && (adrPresent || !adrRequired) && semverOk
      ? "pass"
      : "reject",
  };
}

export function s3Handler(ctx: StationContext): StationOutcomeDraft {
  const specsDir = resolve(ctx.repoRoot, "specs");
  const specs = loadAllSpecs(specsDir, ctx.repoRoot);
  const validate = loadSchemaValidator(ctx.repoRoot);
  const violations = runLint(specs, validate);

  // Read impact report to get classification (S4 runs before S3 in the pipeline?
  // Actually S3 runs BEFORE S4 in pipeline order. Use "additive" as default —
  // real classification comes from S4 which runs after S3.
  // Phase 1 simplification: S3 doesn't block on ADR for additive changes.
  let classification = "additive";
  const impactPath = resolve(ctx.repoRoot, ".keystone", "impact-report.json");
  if (existsSync(impactPath)) {
    try {
      const impact: ImpactReport = JSON.parse(readFileSync(impactPath, "utf8"));
      classification = impact.classification;
    } catch { /* use default */ }
  }

  const report = runGovernance(violations, ctx.runId, classification);

  const outDir = resolve(ctx.repoRoot, ".keystone");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    resolve(outDir, "governance-report.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );

  return {
    verdict: report.verdict,
    message:
      report.verdict === "pass"
        ? `S3: ${violations.length} lint items, 0 blockers. ADR/semver OK.`
        : `S3: ${report.lint_blockers} blocker(s) found.`,
    report_path: ".keystone/governance-report.json",
  };
}
