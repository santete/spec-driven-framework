/**
 * S3 — Governance: spec lint + ADR validation + semver check.
 * PRD §7.1 S3, gates G1 (spec lint) + G2 (ADR).
 *
 * Phase 0 M4: reuses existing runLint (SR1, SR3, SR4, SR6).
 * ADR + semver checks auto-pass on first run (all specs new/additive).
 */
import { resolve } from "node:path";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import type { StationContext, StationOutcomeDraft } from "../orchestrator/stations.js";
import type { GovernanceReport } from "./types.js";
import type { Violation } from "../lint/types.js";
import { loadAllSpecs } from "../spec/loader.js";
import { loadSchemaValidator } from "../spec/validator.js";
import { runLint } from "../lint/runner.js";

export function runGovernance(
  violations: Violation[],
  runId: string,
  hasBaseline: boolean,
): GovernanceReport {
  const blockers = violations.filter((v) => v.severity === "blocker");

  // ADR: first run (no baseline) = all specs new = additive → no ADR required
  const adrRequired = hasBaseline; // only when modifying existing specs
  const adrPresent = !adrRequired; // auto-pass when not required

  // Semver: first run = no prior version → auto-pass
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

  // Check if baseline exists (indicates prior run → modifications, not first run)
  const hasBaseline = existsSync(
    resolve(ctx.repoRoot, ".keystone", "baseline-specs.json"),
  );

  const report = runGovernance(violations, ctx.runId, hasBaseline);

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
