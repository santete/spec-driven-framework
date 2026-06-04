/**
 * Station registry. In M3 only S0 has real logic (wraps the existing
 * intake-qc pipeline). S1–S8 are stubs that auto-pass — their real
 * implementations land in M4 (semantic-diff, sdd-designer, codegen, …).
 *
 * Each handler receives a StationContext and returns a StationOutcomeDraft.
 * The runner is responsible for stamping `started_at` / `ended_at` and
 * threading the outcome through `recordOutcome`.
 */
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import type { StationId, StationVerdict } from "./types.js";
import { loadAllSpecs } from "../spec/loader.js";
import { loadSchemaValidator } from "../spec/validator.js";
import { runIntakeQc } from "../intake/runner.js";

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

function stub(station: StationId): StationHandler {
  return () => ({
    verdict: "skipped",
    message: `${station} stub — implementation deferred to M4`,
  });
}

export const STATION_HANDLERS: Record<StationId, StationHandler> = {
  S0: s0Handler,
  S1: stub("S1"),
  S2: stub("S2"),
  S3: stub("S3"),
  S4: stub("S4"),
  S5: stub("S5"),
  S6: stub("S6"),
  S7: stub("S7"),
  S8: stub("S8"),
};
