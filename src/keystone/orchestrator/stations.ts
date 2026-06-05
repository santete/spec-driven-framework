/**
 * Station registry — M4: all 9 stations have real logic.
 *
 * S0  Intake QC (IQ1–IQ8 + SR1–SR9)
 * S1  Spec graph (relation graph, cycle detection)
 * S2  Traceability (trace index bootstrap)
 * S3  Governance (lint + ADR + semver)
 * S4  Impact analysis (semantic diff + classification)
 * S5  SDD design (template-based, auto-approved)
 * S6  Production (template-based codegen)
 * S7  Verification (gates G5–G8)
 * S8  Delivery (pre-commit G0–G9 + atomic commit)
 */
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import type { StationId, StationVerdict } from "./types.js";
import { loadAllSpecs } from "../spec/loader.js";
import { loadSchemaValidator } from "../spec/validator.js";
import { runIntakeQc } from "../intake/runner.js";
import { s1Handler } from "../stations/s1-spec-graph.js";
import { s2Handler } from "../stations/s2-traceability.js";
import { s3Handler } from "../stations/s3-governance.js";
import { s4Handler } from "../stations/s4-impact.js";
import { s5Handler } from "../stations/s5-sdd-design.js";
import { s6Handler } from "../stations/s6-production.js";
import { s7Handler } from "../stations/s7-verification.js";
import { s8Handler } from "../stations/s8-delivery.js";

export interface StationContext {
  repoRoot: string;
  runId: string;
  specChangeId: string;
}

export interface StationOutcomeDraft {
  verdict: StationVerdict;
  message?: string;
  report_path?: string;
}

export type StationHandler = (ctx: StationContext) => StationOutcomeDraft;

function s0Handler(ctx: StationContext): StationOutcomeDraft {
  const specsDir = resolve(ctx.repoRoot, "specs");
  const specs = loadAllSpecs(specsDir, ctx.repoRoot);
  const validate = loadSchemaValidator(ctx.repoRoot);
  const report = runIntakeQc(specs, validate, ctx.runId);

  const outDir = resolve(ctx.repoRoot, ".keystone");
  mkdirSync(outDir, { recursive: true });
  const reportPath = resolve(outDir, "intake-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  return {
    verdict: report.verdict === "pass" ? "pass" : "reject",
    message: report.summary,
    report_path: ".keystone/intake-report.json",
  };
}

export const STATION_HANDLERS: Record<StationId, StationHandler> = {
  S0: s0Handler,
  S1: s1Handler,
  S2: s2Handler,
  S3: s3Handler,
  S4: s4Handler,
  S5: s5Handler,
  S6: s6Handler,
  S7: s7Handler,
  S8: s8Handler,
};
