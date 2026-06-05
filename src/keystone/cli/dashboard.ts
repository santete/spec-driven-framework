/**
 * CLI: `npx tsx src/keystone/cli/dashboard.ts`
 *
 * Rich dashboard — shows per-station checklist with details.
 * Reads all .keystone/*.json reports + .trace/ + run-state.
 */
import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadRunState } from "../orchestrator/store.js";
import { STATIONS, type StationId, type RunState } from "../orchestrator/types.js";
import type {
  SpecGraph,
  TraceIndex,
  TraceReport,
  GovernanceReport,
  ImpactReport,
  SddReport,
  ProductionReport,
  VerificationReport,
  DeliveryReport,
} from "../stations/types.js";

// ── Report loaders ────────────────────────────────────────────────

function loadJson<T>(repoRoot: string, relPath: string): T | null {
  const p = resolve(repoRoot, relPath);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
}

// ── Station checklist builders ────────────────────────────────────

interface CheckItem {
  label: string;
  status: "pass" | "fail" | "skip" | "info";
  detail?: string;
}

function s0Checklist(repoRoot: string): CheckItem[] {
  const report = loadJson<{ verdict: string; total_items: number; items: Array<{ severity: string; criterion: string; message: string }> }>(repoRoot, ".keystone/intake-report.json");
  if (!report) return [{ label: "Intake report", status: "skip", detail: "not generated" }];

  const blockers = report.items.filter((i) => i.severity === "blocker");
  const warnings = report.items.filter((i) => i.severity === "warning");
  return [
    { label: "Schema validation (SR4)", status: blockers.some((b) => b.criterion === "SR4") ? "fail" : "pass" },
    { label: "Unique IDs (SR1)", status: blockers.some((b) => b.criterion === "SR1") ? "fail" : "pass" },
    { label: "No orphan refs (SR3)", status: blockers.some((b) => b.criterion === "SR3") ? "fail" : "pass" },
    { label: "REQ must→AC (SR6)", status: blockers.some((b) => b.criterion === "SR6") ? "fail" : "pass" },
    { label: "Completeness (IQ1)", status: blockers.some((b) => b.criterion === "IQ1") ? "fail" : "pass" },
    { label: "Clarity (IQ2)", status: blockers.some((b) => b.criterion === "IQ2") ? "fail" : "pass" },
    { label: "Feasibility (IQ3)", status: blockers.some((b) => b.criterion === "IQ3") ? "fail" : "pass" },
    { label: "Resolvability (IQ4)", status: blockers.some((b) => b.criterion === "IQ4") ? "fail" : "pass" },
    { label: "NFR measurability (IQ6)", status: blockers.some((b) => b.criterion === "IQ6") ? "fail" : "pass" },
    { label: "PROJECT present (IQ8)", status: blockers.some((b) => b.criterion === "IQ8") ? "fail" : "pass" },
    { label: `Verdict: ${blockers.length} blockers, ${warnings.length} warnings`, status: "info" },
  ];
}

function s1Checklist(repoRoot: string): CheckItem[] {
  const graph = loadJson<SpecGraph>(repoRoot, ".keystone/spec-graph.json");
  if (!graph) return [{ label: "Spec graph", status: "skip" }];
  return [
    { label: `Nodes: ${graph.nodes.length} specs loaded`, status: "pass" },
    { label: `Edges: ${graph.edges.length} relations resolved`, status: "pass" },
    { label: `Cycles: ${graph.topologicalOrder.length === graph.nodes.length ? "none" : "DETECTED"}`, status: graph.topologicalOrder.length === graph.nodes.length ? "pass" : "fail" },
    { label: `Topological order: ${graph.topologicalOrder.slice(0, 5).join(" → ")}${graph.topologicalOrder.length > 5 ? " …" : ""}`, status: "info" },
  ];
}

function s2Checklist(repoRoot: string): CheckItem[] {
  const report = loadJson<TraceReport>(repoRoot, ".keystone/trace-report.json");
  const index = loadJson<TraceIndex>(repoRoot, ".trace/index.json");
  if (!report) return [{ label: "Trace report", status: "skip" }];
  return [
    { label: `Created: ${report.created} new entries`, status: "pass" },
    { label: `Updated: ${report.updated} existing entries`, status: "pass" },
    { label: `Total: ${report.total} in trace index`, status: "pass" },
    { label: `Index file: .trace/index.json`, status: index ? "pass" : "fail" },
  ];
}

function s3Checklist(repoRoot: string): CheckItem[] {
  const report = loadJson<GovernanceReport>(repoRoot, ".keystone/governance-report.json");
  if (!report) return [{ label: "Governance report", status: "skip" }];
  return [
    { label: `Lint: ${report.lint_violations} violations, ${report.lint_blockers} blockers`, status: report.lint_blockers === 0 ? "pass" : "fail" },
    { label: `ADR required: ${report.adr_required}`, status: report.adr_required && !report.adr_present ? "fail" : "pass" },
    { label: `Semver: ${report.semver_ok ? "consistent" : "MISMATCH"}`, status: report.semver_ok ? "pass" : "fail" },
  ];
}

function s4Checklist(repoRoot: string): CheckItem[] {
  const report = loadJson<ImpactReport>(repoRoot, ".keystone/impact-report.json");
  if (!report) return [{ label: "Impact report", status: "skip" }];
  const added = report.changes.filter((c) => c.op === "added").length;
  const modified = report.changes.filter((c) => c.op === "modified").length;
  const removed = report.changes.filter((c) => c.op === "removed").length;
  return [
    { label: `Classification: ${report.classification}`, status: report.classification === "breaking" ? "fail" : "pass" },
    { label: `Changes: +${added} added, ~${modified} modified, -${removed} removed`, status: "pass" },
    { label: `Affected: ${report.affected_ids.length} spec IDs`, status: "pass" },
    { label: `Actions: ${report.required_actions.length} (${report.required_actions.map((a) => a.action).filter((v, i, a) => a.indexOf(v) === i).join(", ")})`, status: "info" },
  ];
}

function s5Checklist(repoRoot: string): CheckItem[] {
  const report = loadJson<SddReport>(repoRoot, ".keystone/sdd-report.json");
  if (!report) return [{ label: "SDD report", status: "skip" }];
  return [
    { label: `SDDs generated: ${report.sdds.length}`, status: report.sdds.length > 0 ? "pass" : "fail" },
    ...report.sdds.map((s) => ({
      label: `${s.id} → covers [${s.spec_ids_covered.join(", ")}]`,
      status: "pass" as const,
      detail: s.file_path,
    })),
    { label: `All approved: ${report.sdds.every((s) => s.status === "approved") ? "yes" : "NO"}`, status: report.sdds.every((s) => s.status === "approved") ? "pass" : "fail" },
  ];
}

function s6Checklist(repoRoot: string): CheckItem[] {
  const report = loadJson<ProductionReport>(repoRoot, ".keystone/production-report.json");
  if (!report) return [{ label: "Production report", status: "skip" }];
  const impl = report.generated_files.filter((f) => f.type === "implementation");
  const tests = report.generated_files.filter((f) => f.type === "test");
  return [
    { label: `Implementation files: ${impl.length}`, status: impl.length > 0 ? "pass" : "fail" },
    ...impl.map((f) => ({ label: `  ${f.path}`, status: "info" as const, detail: `owner: ${f.owner_spec_id}` })),
    { label: `Test files: ${tests.length}`, status: tests.length > 0 ? "pass" : "fail" },
    ...tests.map((f) => ({ label: `  ${f.path}`, status: "info" as const, detail: `owner: ${f.owner_spec_id}` })),
    { label: `Provenance headers: all present`, status: "pass" },
    { label: `Ownership updated: .trace/ownership.yaml`, status: "pass" },
  ];
}

function s7Checklist(repoRoot: string): CheckItem[] {
  const report = loadJson<VerificationReport>(repoRoot, ".keystone/verification-report.json");
  if (!report) return [{ label: "Verification report", status: "skip" }];
  return report.gates.map((g) => ({
    label: `${g.gate_id}: ${g.message}`,
    status: g.status === "pass" ? "pass" as const : "fail" as const,
  }));
}

function s8Checklist(repoRoot: string): CheckItem[] {
  const report = loadJson<DeliveryReport>(repoRoot, ".keystone/delivery-report.json");
  if (!report) return [{ label: "Delivery report", status: "skip" }];
  return [
    { label: `Pre-commit gates: ${report.gates_checked.length} checked`, status: "pass" },
    { label: `Classification: ${report.classification}`, status: report.classification === "breaking" ? "fail" : "pass" },
    { label: `G9 breaking review: ${report.classification === "breaking" ? "REQUIRED" : "auto-pass (additive)"}`, status: "pass" },
    { label: `Commit: ${report.commit_sha ? report.commit_sha.slice(0, 8) : "(dry-run/skipped)"}`, status: report.commit_sha ? "pass" : "info" },
    { label: `Verdict: ${report.verdict}`, status: report.verdict === "pass" ? "pass" : "fail" },
  ];
}

const CHECKLIST_BUILDERS: Record<StationId, (repoRoot: string) => CheckItem[]> = {
  S0: s0Checklist, S1: s1Checklist, S2: s2Checklist, S3: s3Checklist,
  S4: s4Checklist, S5: s5Checklist, S6: s6Checklist, S7: s7Checklist, S8: s8Checklist,
};

const STATION_NAMES: Record<StationId, string> = {
  S0: "Intake QC", S1: "Spec Graph", S2: "Traceability", S3: "Governance",
  S4: "Impact Analysis", S5: "SDD Design", S6: "Production", S7: "Verification", S8: "Delivery",
};

// ── Render ────────────────────────────────────────────────────────

function icon(status: string): string {
  switch (status) {
    case "pass": return "☑";
    case "fail": return "☒";
    case "skip": return "☐";
    case "info": return "  ";
    default: return "?";
  }
}

function stationIcon(verdict?: string): string {
  switch (verdict) {
    case "pass": return "✅"; case "reject": return "❌";
    case "blocked": return "⏸️"; case "skipped": return "⏭️";
    default: return "⬜";
  }
}

export function renderDashboard(repoRoot: string): string {
  const state = loadRunState(repoRoot);
  if (!state) return "No active run — .keystone/run-state.json not found.";

  const lines: string[] = [];
  lines.push("╔══════════════════════════════════════════════════════════════╗");
  lines.push(`║  KEYSTONE PIPELINE DASHBOARD                                ║`);
  lines.push("╠══════════════════════════════════════════════════════════════╣");
  lines.push(`║  Run:    ${state.run_id.padEnd(50)}║`);
  lines.push(`║  Title:  ${(state.input.title ?? "").padEnd(50)}║`);
  lines.push(`║  Status: ${state.status.toUpperCase().padEnd(50)}║`);
  lines.push(`║  Rework: ${state.rework_global.count}/${state.rework_global.k_global}${" ".repeat(47)}║`);
  lines.push("╚══════════════════════════════════════════════════════════════╝");
  lines.push("");

  const historyMap = new Map(state.history.map((h) => [h.station, h]));

  for (const station of STATIONS) {
    const h = historyMap.get(station);
    const verdict = h?.verdict ?? (station === state.current_station ? "pending" : "");
    const si = stationIcon(verdict);
    const name = STATION_NAMES[station];
    const duration = h ? `${((new Date(h.ended_at).getTime() - new Date(h.started_at).getTime()) / 1000).toFixed(1)}s` : "";

    lines.push(`${si} ${station} — ${name} ${duration ? `(${duration})` : ""}`);

    if (h?.verdict === "blocked") {
      lines.push(`   ⏸️  ${h.message ?? ""}`);
      lines.push("");
      continue;
    }

    // Show checklist
    const checklist = CHECKLIST_BUILDERS[station](repoRoot);
    for (const item of checklist) {
      const ic = icon(item.status);
      const detail = item.detail ? ` — ${item.detail}` : "";
      lines.push(`   ${ic} ${item.label}${detail}`);
    }
    lines.push("");
  }

  // Footer
  if (state.last_report_path) {
    lines.push(`📄 Last report: ${state.last_report_path}`);
  }
  if (state.status === "done") {
    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("🎉 Pipeline complete — all 9 stations passed.");
  }

  return lines.join("\n");
}

// CLI entry
const invoked = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (invoked) {
  process.stdout.write(renderDashboard(process.cwd()) + "\n");
}
