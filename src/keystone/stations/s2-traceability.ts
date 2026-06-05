/**
 * S2 — Traceability: create/update trace index from spec graph.
 * PRD §7.1 S2, §10.1 trace index format.
 */
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import type { StationContext, StationOutcomeDraft } from "../orchestrator/stations.js";
import type { SpecGraph } from "./types.js";
import type { TraceIndex, TraceEntry, TraceReport } from "./types.js";
import { loadAllSpecs } from "../spec/loader.js";

function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex").slice(0, 16);
}

export function buildTraceIndex(
  graph: SpecGraph,
  specs: Array<{ data: { id: string; version: string }; relPath: string; raw: string }>,
  runId: string,
  existingIndex?: TraceIndex,
): { index: TraceIndex; report: TraceReport } {
  const existingMap = new Map<string, TraceEntry>();
  if (existingIndex) {
    for (const e of existingIndex.entries) {
      existingMap.set(e.spec_id, e);
    }
  }

  let created = 0;
  let updated = 0;
  const entries: TraceEntry[] = [];

  for (const node of graph.nodes) {
    const spec = specs.find((s) => s.data.id === node.id);
    if (!spec) continue;

    const existing = existingMap.get(node.id);
    const hash = hashContent(spec.raw);

    if (existing) {
      entries.push({
        ...existing,
        spec_version: spec.data.version,
        spec_content_hash: hash,
        last_run_id: runId,
      });
      updated++;
    } else {
      entries.push({
        spec_id: node.id,
        spec_path: spec.relPath,
        spec_version: spec.data.version,
        spec_content_hash: hash,
        implementations: [],
        tests: [],
        last_run_id: runId,
      });
      created++;
    }
  }

  return {
    index: { version: 1, entries },
    report: { run_id: runId, created, updated, total: entries.length },
  };
}

export function s2Handler(ctx: StationContext): StationOutcomeDraft {
  // Read spec graph from S1
  const graphPath = resolve(ctx.repoRoot, ".keystone", "spec-graph.json");
  if (!existsSync(graphPath)) {
    return { verdict: "reject", message: "S2: spec-graph.json missing (S1 must run first)" };
  }
  const graph: SpecGraph = JSON.parse(readFileSync(graphPath, "utf8"));

  // Load specs for content hashing
  const specs = loadAllSpecs(resolve(ctx.repoRoot, "specs"), ctx.repoRoot);

  // Load existing trace index if present
  const traceDir = resolve(ctx.repoRoot, ".trace");
  const indexPath = resolve(traceDir, "index.json");
  let existingIndex: TraceIndex | undefined;
  if (existsSync(indexPath)) {
    try {
      existingIndex = JSON.parse(readFileSync(indexPath, "utf8"));
    } catch {
      // Corrupted index — rebuild from scratch
    }
  }

  const { index, report } = buildTraceIndex(graph, specs, ctx.runId, existingIndex);

  // Write trace index
  mkdirSync(traceDir, { recursive: true });
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n", "utf8");

  // Write report
  const outDir = resolve(ctx.repoRoot, ".keystone");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    resolve(outDir, "trace-report.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );

  return {
    verdict: "pass",
    message: `S2: ${report.created} created, ${report.updated} updated, ${report.total} total trace entries.`,
    report_path: ".keystone/trace-report.json",
  };
}
