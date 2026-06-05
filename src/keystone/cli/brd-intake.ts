/**
 * CLI: `npx tsx src/keystone/cli/brd-intake.ts --source <brd-file> [--json]`
 *
 * Gate 0: Validates that BRD → spec conversion produced valid artifacts.
 * Runs S0 intake QC on draft specs and reports readiness for pipeline.
 *
 * Flow: BRD file → brd-parser subagent → specs/<domain>/*.md → this CLI validates → PO reviews → /spec-change
 */
import { resolve, relative, sep } from "node:path";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { loadAllSpecs, findProject } from "../spec/loader.js";
import { loadSchemaValidator } from "../spec/validator.js";
import { runIntakeQc } from "../intake/runner.js";
import type { SpecFile, SpecFrontmatter } from "../types.js";

export interface BrdIntakeResult {
  exitCode: number;
  stdout: string;
  artifacts?: ArtifactSummary[];
  intakeVerdict?: "pass" | "reject";
  todos?: string[];
}

interface ArtifactSummary {
  id: string;
  type: string;
  title: string;
  status: string;
  priority?: string;
  acCount: number;
  fieldCount: number;
  file: string;
  todos: string[];
}

function findDraftSpecs(specs: SpecFile[]): SpecFile[] {
  return specs.filter((s) => s.data.status === "draft");
}

function extractTodos(raw: string): string[] {
  const matches = raw.match(/# TODO:.*/g) ?? [];
  return matches.map((m) => m.replace("# TODO: ", "").trim());
}

function summarizeArtifact(spec: SpecFile): ArtifactSummary {
  return {
    id: spec.data.id,
    type: spec.data.type,
    title: spec.data.title,
    status: spec.data.status ?? "draft",
    priority: spec.data.priority,
    acCount: spec.data.acceptance_criteria?.length ?? 0,
    fieldCount: spec.data.fields?.length ?? 0,
    file: spec.relPath,
    todos: extractTodos(spec.raw),
  };
}

export function runBrdIntake(opts: {
  source: string;
  repoRoot: string;
  json?: boolean;
}): BrdIntakeResult {
  const specsDir = resolve(opts.repoRoot, "specs");
  const specs = loadAllSpecs(specsDir, opts.repoRoot);
  const drafts = findDraftSpecs(specs);

  if (drafts.length === 0) {
    return {
      exitCode: 1,
      stdout: [
        "📋 BRD INTAKE — Gate 0",
        "",
        "❌ No draft specs found.",
        "",
        "Run the BRD parser first:",
        `  /brd-intake ${opts.source}`,
        "",
        "This launches the brd-parser subagent to convert your BRD into spec artifacts.",
      ].join("\n"),
    };
  }

  // Summarize artifacts
  const artifacts = drafts.map(summarizeArtifact);
  const allTodos = artifacts.flatMap((a) => a.todos.map((t) => `${a.id}: ${t}`));

  // Run S0 intake QC
  const validate = loadSchemaValidator(opts.repoRoot);
  const report = runIntakeQc(specs, validate, `brd-intake-${Date.now()}`);
  const draftIds = new Set(drafts.map((s) => s.data.id));
  const draftViolations = report.items.filter((v) => draftIds.has(v.id));
  const draftBlockers = draftViolations.filter((v) => v.severity === "blocker");

  if (opts.json) {
    return {
      exitCode: draftBlockers.length > 0 ? 1 : 0,
      stdout: JSON.stringify({ artifacts, intake_verdict: draftBlockers.length === 0 ? "pass" : "reject", violations: draftViolations, todos: allTodos }, null, 2),
      artifacts,
      intakeVerdict: draftBlockers.length === 0 ? "pass" : "reject",
      todos: allTodos,
    };
  }

  // Rich dashboard output
  const lines: string[] = [];
  lines.push("╔══════════════════════════════════════════════════════════════╗");
  lines.push("║  📋 BRD INTAKE — Gate 0                                    ║");
  lines.push("╠══════════════════════════════════════════════════════════════╣");
  lines.push(`║  Source: ${opts.source.padEnd(50)}║`);
  lines.push(`║  Draft specs: ${String(drafts.length).padEnd(45)}║`);
  lines.push("╚══════════════════════════════════════════════════════════════╝");
  lines.push("");

  // Group by type
  const byType = new Map<string, ArtifactSummary[]>();
  for (const a of artifacts) {
    const list = byType.get(a.type) ?? [];
    list.push(a);
    byType.set(a.type, list);
  }

  const typeOrder = ["feature", "requirement", "entity", "nfr", "api", "schema"];
  const typeIcons: Record<string, string> = {
    feature: "🎯", requirement: "📝", entity: "🗃️",
    nfr: "⚡", api: "🔌", schema: "📐",
  };

  for (const type of typeOrder) {
    const items = byType.get(type);
    if (!items) continue;
    lines.push(`${typeIcons[type] ?? "📄"} ${type.toUpperCase()} (${items.length})`);
    for (const a of items) {
      const priority = a.priority ? ` [${a.priority}]` : "";
      const acs = a.acCount > 0 ? ` — ${a.acCount} AC` : "";
      const fields = a.fieldCount > 0 ? ` — ${a.fieldCount} fields` : "";
      lines.push(`   ${a.status === "draft" ? "☐" : "☑"} ${a.id}${priority}: "${a.title}"${acs}${fields}`);
      lines.push(`     → ${a.file}`);
      for (const todo of a.todos) {
        lines.push(`     ⚠️  TODO: ${todo}`);
      }
    }
    lines.push("");
  }

  // Relations map
  lines.push("🔗 RELATIONS");
  for (const draft of drafts) {
    const rels = draft.data.relations;
    if (!rels) continue;
    const parts: string[] = [];
    if (rels.refines?.length) parts.push(`refines [${rels.refines.join(", ")}]`);
    if (rels.depends_on?.length) parts.push(`depends_on [${rels.depends_on.join(", ")}]`);
    if (parts.length) lines.push(`   ${draft.data.id} → ${parts.join(", ")}`);
  }
  lines.push("");

  // S0 validation
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (draftBlockers.length === 0) {
    lines.push("✅ S0 INTAKE QC: PASS");
    lines.push("");
    lines.push("Next steps:");
    lines.push("  1. PO reviews specs above");
    lines.push("  2. Change status: draft → approved (in each file)");
    lines.push(`  3. Run: /spec-change --title "${opts.source.replace(/.*[/\\]/, "").replace(/\.\w+$/, "")}"`);
  } else {
    lines.push(`❌ S0 INTAKE QC: ${draftBlockers.length} BLOCKER(S)`);
    for (const v of draftBlockers) {
      lines.push(`   ${v.id} [${v.criterion}] ${v.field}: ${v.message}`);
    }
    lines.push("");
    lines.push("Fix blockers, then re-run this command.");
  }

  if (allTodos.length > 0) {
    lines.push("");
    lines.push(`⚠️  ${allTodos.length} TODO(s) for PO to clarify`);
  }

  return {
    exitCode: draftBlockers.length > 0 ? 1 : 0,
    stdout: lines.join("\n"),
    artifacts,
    intakeVerdict: draftBlockers.length === 0 ? "pass" : "reject",
    todos: allTodos,
  };
}

// CLI entry
const invoked = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (invoked) {
  const args = process.argv.slice(2);
  const sourceIdx = args.indexOf("--source");
  const source = sourceIdx >= 0 ? args[sourceIdx + 1] : "brd.md";
  const json = args.includes("--json");
  const result = runBrdIntake({ source, repoRoot: process.cwd(), json });
  process.stdout.write(result.stdout + "\n");
  process.exit(result.exitCode);
}
