/**
 * CLI: /keystone:md2spec — validate converted spec files.
 *
 * Phase 3: After the md-to-spec subagent converts prose → spec,
 * this CLI validates the output passes S0 intake QC and reports
 * what was generated for user confirmation.
 *
 * Usage:
 *   npx tsx src/keystone/cli/md2spec.ts --source <prose.md> [--json]
 */
import { resolve, basename } from "node:path";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadAllSpecs, findProject } from "../spec/loader.js";
import { loadSchemaValidator } from "../spec/validator.js";
import { runIntakeQc } from "../intake/runner.js";
import type { SpecFile } from "../types.js";

export interface Md2SpecResult {
  exitCode: number;
  stdout: string;
  generatedSpecs?: Array<{
    path: string;
    id: string;
    type: string;
    title: string;
    status: string;
    todos: string[];
  }>;
  intakeVerdict?: "pass" | "reject";
}

export function runMd2SpecValidation(opts: {
  source: string;
  repoRoot: string;
  json?: boolean;
}): Md2SpecResult {
  const specsDir = resolve(opts.repoRoot, "specs");

  // Load all specs (including newly generated ones)
  const specs = loadAllSpecs(specsDir, opts.repoRoot);

  // Find specs with status=draft (these are likely the newly converted ones)
  const draftSpecs = specs.filter((s) => s.data.status === "draft");

  if (draftSpecs.length === 0) {
    return {
      exitCode: 1,
      stdout: "md2spec: No draft specs found. Run the md-to-spec subagent first.",
    };
  }

  // Validate all specs pass S0
  const validate = loadSchemaValidator(opts.repoRoot);
  const report = runIntakeQc(specs, validate, `md2spec-${Date.now()}`);

  // Extract TODOs from draft specs
  const generatedSpecs = draftSpecs.map((s) => {
    const todos: string[] = [];
    const content = s.raw;
    const todoMatches = content.match(/# TODO:.*/g) ?? [];
    todos.push(...todoMatches.map((m) => m.replace("# TODO: ", "")));
    if (!s.data.acceptance_criteria?.length && s.data.type === "requirement") {
      todos.push("Missing acceptance criteria");
    }

    return {
      path: s.relPath,
      id: s.data.id,
      type: s.data.type,
      title: s.data.title,
      status: s.data.status ?? "draft",
      todos,
    };
  });

  // Filter violations for draft specs only
  const draftIds = new Set(draftSpecs.map((s) => s.data.id));
  const draftViolations = report.items.filter((v) => draftIds.has(v.id));
  const draftBlockers = draftViolations.filter((v) => v.severity === "blocker");

  if (opts.json) {
    return {
      exitCode: draftBlockers.length > 0 ? 1 : 0,
      stdout: JSON.stringify({
        generated: generatedSpecs,
        intake_verdict: draftBlockers.length === 0 ? "pass" : "reject",
        violations: draftViolations,
      }, null, 2),
      generatedSpecs,
      intakeVerdict: draftBlockers.length === 0 ? "pass" : "reject",
    };
  }

  // Human-readable output
  const lines: string[] = [
    "📝 MD→SPEC VALIDATION",
    "",
    `Source: ${opts.source}`,
    `Generated: ${generatedSpecs.length} spec artifact(s)`,
    "",
  ];

  for (const spec of generatedSpecs) {
    lines.push(`  ${spec.id} (${spec.type}) — "${spec.title}"`);
    lines.push(`    Path: ${spec.path}`);
    lines.push(`    Status: ${spec.status}`);
    if (spec.todos.length > 0) {
      lines.push(`    ⚠️  TODOs:`);
      for (const todo of spec.todos) lines.push(`      - ${todo}`);
    }
  }

  lines.push("");
  if (draftBlockers.length > 0) {
    lines.push(`❌ Intake QC: ${draftBlockers.length} blocker(s)`);
    for (const v of draftBlockers) {
      lines.push(`  ${v.id} [${v.criterion}] ${v.field}: ${v.message}`);
    }
    lines.push("");
    lines.push("Fix blockers, then run this command again.");
  } else {
    lines.push("✅ Intake QC: PASS (draft specs are valid)");
    lines.push("");
    lines.push("Next steps:");
    lines.push("  1. Review generated specs above");
    lines.push("  2. Change status from 'draft' to 'approved' when satisfied");
    lines.push("  3. Run /spec-change to process through pipeline");
  }

  return {
    exitCode: draftBlockers.length > 0 ? 1 : 0,
    stdout: lines.join("\n"),
    generatedSpecs,
    intakeVerdict: draftBlockers.length === 0 ? "pass" : "reject",
  };
}

// CLI entry point
const invoked = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (invoked) {
  const args = process.argv.slice(2);
  const sourceIdx = args.indexOf("--source");
  const source = sourceIdx >= 0 ? args[sourceIdx + 1] : "prose.md";
  const json = args.includes("--json");
  const repoRoot = process.cwd();

  const result = runMd2SpecValidation({ source, repoRoot, json });
  process.stdout.write(result.stdout + "\n");
  process.exit(result.exitCode);
}
