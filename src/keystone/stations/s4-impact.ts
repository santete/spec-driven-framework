/**
 * S4 — Impact Analysis: semantic diff + classification + impact report.
 * PRD §7.1 S4, §8.5 classification table.
 *
 * Phase 0 M4: compares spec content hashes against baseline.
 * First run = no baseline → all specs "added" → classification "additive".
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
} from "./types.js";
import { loadAllSpecs } from "../spec/loader.js";

function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex").slice(0, 16);
}

export function computeImpact(
  specs: Array<{ data: { id: string; type: string }; relPath: string; raw: string }>,
  baseline: BaselineSpecs | null,
  runId: string,
): { report: ImpactReport; newBaseline: BaselineSpecs } {
  const changes: SpecChange[] = [];
  const newHashes: Record<string, string> = {};

  for (const spec of specs) {
    const hash = hashContent(spec.raw);
    newHashes[spec.data.id] = hash;
    const oldHash = baseline?.hashes[spec.data.id];

    if (!oldHash) {
      changes.push({ id: spec.data.id, op: "added", spec_path: spec.relPath, hash });
    } else if (oldHash !== hash) {
      changes.push({ id: spec.data.id, op: "modified", spec_path: spec.relPath, hash });
    }
    // unchanged specs are not listed in changes
  }

  // Check for removed specs (in baseline but not in current)
  if (baseline) {
    for (const id of Object.keys(baseline.hashes)) {
      if (!newHashes[id]) {
        changes.push({ id, op: "removed", spec_path: "", hash: "" });
      }
    }
  }

  // Classification: any removed/modified = could be breaking; all added = additive
  let classification: ChangeClassification = "cosmetic";
  if (changes.some((c) => c.op === "removed")) {
    classification = "breaking";
  } else if (changes.some((c) => c.op === "modified")) {
    classification = "additive"; // simplified: real classification needs field-level diff
  } else if (changes.some((c) => c.op === "added")) {
    classification = "additive";
  }

  const affected_ids = changes.map((c) => c.id);
  const required_actions = changes
    .filter((c) => c.op !== "removed")
    .map((c) => ({
      id: c.id,
      action: c.op === "added" ? "generate" : "regenerate",
    }));

  return {
    report: {
      run_id: runId,
      classification,
      changes,
      affected_ids,
      required_actions,
    },
    newBaseline: { version: 1, hashes: newHashes },
  };
}

export function s4Handler(ctx: StationContext): StationOutcomeDraft {
  const specs = loadAllSpecs(resolve(ctx.repoRoot, "specs"), ctx.repoRoot);

  // Load baseline if exists
  const baselinePath = resolve(ctx.repoRoot, ".keystone", "baseline-specs.json");
  let baseline: BaselineSpecs | null = null;
  if (existsSync(baselinePath)) {
    try {
      baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
    } catch {
      // Corrupted → treat as no baseline
    }
  }

  const { report, newBaseline } = computeImpact(specs, baseline, ctx.runId);

  const outDir = resolve(ctx.repoRoot, ".keystone");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    resolve(outDir, "impact-report.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );
  writeFileSync(
    resolve(outDir, "baseline-specs.json"),
    JSON.stringify(newBaseline, null, 2) + "\n",
    "utf8",
  );

  if (report.affected_ids.length === 0) {
    return {
      verdict: "pass",
      message: "S4: No changes detected (all specs unchanged).",
      report_path: ".keystone/impact-report.json",
    };
  }

  return {
    verdict: "pass",
    message: `S4: ${report.changes.length} change(s), classification=${report.classification}, ${report.affected_ids.length} affected.`,
    report_path: ".keystone/impact-report.json",
  };
}
