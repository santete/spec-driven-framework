/**
 * CLI: `npx tsx src/keystone/cli/s0.ts [--dry-run] [--json]`
 *
 * Wires the S0 Intake QC pipeline (PRD §9.0). Slash command `/keystone:S0`
 * delegates to this script.
 *
 * Exit codes:
 *   0 — verdict=pass (or --dry-run regardless)
 *   1 — verdict=reject (blocker violations present)
 *   2 — script error (loader/schema failure)
 */
import { resolve } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import { loadAllSpecs } from "../spec/loader.js";
import { loadSchemaValidator } from "../spec/validator.js";
import { runIntakeQc } from "../intake/runner.js";

interface CliOptions {
  dryRun: boolean;
  json: boolean;
  repoRoot: string;
}

function parseArgs(argv: string[]): CliOptions {
  return {
    dryRun: argv.includes("--dry-run"),
    json: argv.includes("--json"),
    repoRoot: process.cwd(),
  };
}

function generateRunId(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  return `run-${stamp}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

function renderText(report: ReturnType<typeof runIntakeQc>): string {
  const lines: string[] = [];
  const verdictTag = report.verdict === "pass" ? "✓ PASS" : "✗ REJECT";
  lines.push(`[${verdictTag}] ${report.summary}`);
  lines.push(`run_id: ${report.run_id}`);
  if (report.items.length > 0) {
    lines.push("");
    for (const item of report.items) {
      const tag = item.severity === "blocker" ? "■" : item.severity === "warning" ? "▲" : "·";
      lines.push(
        `  ${tag} ${item.criterion}  ${item.spec_path}  ${item.id}  field=${item.field}`,
      );
      lines.push(`     ${item.message}`);
      if (item.suggestion) lines.push(`     → ${item.suggestion}`);
    }
  }
  lines.push("");
  lines.push(`next: ${report.next_action}`);
  return lines.join("\n");
}

export function runS0Cli(opts: CliOptions): { exitCode: 0 | 1 | 2; stdout: string } {
  try {
    const specsDir = resolve(opts.repoRoot, "specs");
    const specs = loadAllSpecs(specsDir, opts.repoRoot);
    const validate = loadSchemaValidator(opts.repoRoot);
    const runId = generateRunId();
    const report = runIntakeQc(specs, validate, runId);

    const stdout = opts.json ? JSON.stringify(report, null, 2) : renderText(report);

    if (!opts.dryRun) {
      const outDir = resolve(opts.repoRoot, ".keystone");
      mkdirSync(outDir, { recursive: true });
      writeFileSync(
        resolve(outDir, "intake-report.json"),
        JSON.stringify(report, null, 2),
        "utf8",
      );
    }

    const exit: 0 | 1 = report.verdict === "pass" || opts.dryRun ? 0 : 1;
    return { exitCode: exit, stdout };
  } catch (err) {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err);
    return { exitCode: 2, stdout: `keystone-S0 error:\n${msg}` };
  }
}

import { fileURLToPath } from "node:url";
const invoked = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (invoked) {
  const opts = parseArgs(process.argv.slice(2));
  const result = runS0Cli(opts);
  process.stdout.write(result.stdout + "\n");
  process.exit(result.exitCode);
}
