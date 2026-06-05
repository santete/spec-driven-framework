/**
 * S1 — Spec Graph: build relation graph, detect cycles, topological sort.
 * PRD §7.1 S1, §7.5.2 XQC-S1.
 */
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import type { StationContext, StationOutcomeDraft } from "../orchestrator/stations.js";
import type { SpecFile, Relations } from "../types.js";
import type { SpecGraph, SpecGraphNode, SpecGraphEdge } from "./types.js";
import { loadAllSpecs } from "../spec/loader.js";

const RELATION_KEYS: (keyof Relations)[] = [
  "refines",
  "depends_on",
  "satisfies",
  "verifies",
  "supersedes",
];

export function buildSpecGraph(specs: SpecFile[]): {
  graph: SpecGraph;
  errors: string[];
} {
  const idSet = new Set(specs.map((s) => s.data.id));
  const nodes: SpecGraphNode[] = specs.map((s) => ({
    id: s.data.id,
    type: s.data.type,
    version: s.data.version,
    specPath: s.relPath,
  }));

  const edges: SpecGraphEdge[] = [];
  const errors: string[] = [];

  for (const spec of specs) {
    const rels = spec.data.relations;
    if (!rels) continue;
    for (const key of RELATION_KEYS) {
      const targets = rels[key];
      if (!targets) continue;
      for (const target of targets) {
        if (!idSet.has(target)) {
          errors.push(
            `${spec.data.id}: relation ${key} references unknown ID "${target}"`,
          );
        }
        edges.push({ from: spec.data.id, to: target, relation: key });
      }
    }
  }

  // Topological sort + cycle detection (Kahn's algorithm)
  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();
  for (const id of idSet) {
    adj.set(id, []);
    inDeg.set(id, 0);
  }
  for (const e of edges) {
    if (idSet.has(e.from) && idSet.has(e.to)) {
      adj.get(e.from)!.push(e.to);
      inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDeg) {
    if (deg === 0) queue.push(id);
  }

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    topologicalOrder.push(node);
    for (const neighbor of adj.get(node) ?? []) {
      const newDeg = (inDeg.get(neighbor) ?? 1) - 1;
      inDeg.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (topologicalOrder.length < idSet.size) {
    const inCycle = [...idSet].filter(
      (id) => !topologicalOrder.includes(id),
    );
    errors.push(`Cycle detected involving: ${inCycle.join(", ")}`);
  }

  return { graph: { nodes, edges, topologicalOrder }, errors };
}

export function s1Handler(ctx: StationContext): StationOutcomeDraft {
  const specsDir = resolve(ctx.repoRoot, "specs");
  const specs = loadAllSpecs(specsDir, ctx.repoRoot);
  const { graph, errors } = buildSpecGraph(specs);

  const outDir = resolve(ctx.repoRoot, ".keystone");
  mkdirSync(outDir, { recursive: true });
  const reportPath = resolve(outDir, "spec-graph.json");
  writeFileSync(reportPath, JSON.stringify(graph, null, 2) + "\n", "utf8");

  if (errors.length > 0) {
    return {
      verdict: "reject",
      message: `S1: ${errors.length} error(s) — ${errors[0]}`,
      report_path: ".keystone/spec-graph.json",
    };
  }

  return {
    verdict: "pass",
    message: `S1: ${graph.nodes.length} specs, ${graph.edges.length} relations, 0 cycles.`,
    report_path: ".keystone/spec-graph.json",
  };
}
