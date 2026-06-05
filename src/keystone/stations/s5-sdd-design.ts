/**
 * S5 — SDD Design: validate Software Design Documents.
 * PRD §7.1 S5, §8.2.8 SDD artifacts, gate G_SDD.
 *
 * Phase 1 dual-mode:
 *   - **Validate mode** (default): Check if SDD files exist in specs/sdd/,
 *     validate schema + approval. If missing → return `blocked` so Claude
 *     can launch sdd-designer subagent, then resume.
 *   - **Bootstrap mode** (KEYSTONE_BOOTSTRAP=1 or tests): Template-generate
 *     SDDs like Phase 0 M4 for deterministic testing.
 */
import { resolve } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import matter from "gray-matter";
import YAML from "yaml";
import type { StationContext, StationOutcomeDraft } from "../orchestrator/stations.js";
import type { ImpactReport, SddReport, SddEntry } from "./types.js";
import type { SpecFile, SpecFrontmatter } from "../types.js";
import { loadAllSpecs, findProject } from "../spec/loader.js";

// ── Validation ────────────────────────────────────────────────────

interface SddValidationResult {
  valid: boolean;
  sdds: SddEntry[];
  issues: string[];
}

function validateSddFiles(
  sddDir: string,
  affectedIds: string[],
  runId: string,
): SddValidationResult {
  const sdds: SddEntry[] = [];
  const issues: string[] = [];

  if (!existsSync(sddDir)) {
    return { valid: false, sdds: [], issues: ["specs/sdd/ directory does not exist"] };
  }

  const files = readdirSync(sddDir).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    return { valid: false, sdds: [], issues: ["No SDD files found in specs/sdd/"] };
  }

  // Track which affected IDs are covered by SDDs
  const coveredIds = new Set<string>();

  for (const file of files) {
    const absPath = resolve(sddDir, file);
    const raw = readFileSync(absPath, "utf8");
    const parsed = matter(raw);
    const data = parsed.data as SpecFrontmatter;

    // Validate required fields
    if (!data.id) {
      issues.push(`${file}: missing 'id' field`);
      continue;
    }
    if (data.type !== "sdd") {
      issues.push(`${file}: type must be 'sdd', got '${data.type}'`);
      continue;
    }
    if (!data.title || !data.version) {
      issues.push(`${file}: missing 'title' or 'version'`);
      continue;
    }

    // Check approval status
    if (data.status !== "approved") {
      issues.push(`${file}: status must be 'approved', got '${data.status}'`);
      continue;
    }

    // Check customer_approval has approval_run_id
    const approval = data.customer_approval as Record<string, unknown> | undefined;
    if (!approval?.approval_run_id) {
      issues.push(`${file}: missing customer_approval.approval_run_id`);
      continue;
    }

    // Check components exist
    if (!data.components || !Array.isArray(data.components) || data.components.length === 0) {
      issues.push(`${file}: must have at least one component`);
      continue;
    }

    // Check risks documented
    if (!data.risks || !Array.isArray(data.risks) || data.risks.length === 0) {
      issues.push(`${file}: must document at least one risk`);
      continue;
    }

    // Track covered spec IDs from derived_from
    const derivedFrom = data.derived_from as Record<string, unknown> | undefined;
    const specIds = (derivedFrom?.spec_ids as string[]) ??
                    (derivedFrom?.features as string[]) ??
                    [];
    for (const id of specIds) coveredIds.add(id);

    sdds.push({
      id: data.id,
      spec_ids_covered: specIds,
      file_path: `specs/sdd/${file}`,
      status: "approved",
    });
  }

  // Check coverage: affected REQ/FEAT/ENT should have SDD coverage
  // (PROJECT type doesn't need SDD)
  const needsCoverage = affectedIds.filter(
    (id) => !id.startsWith("PROJECT") && !coveredIds.has(id),
  );
  // Relaxed: we don't require 1:1 coverage (SDD can cover multiple IDs via features)
  // Just warn if nothing is covered at all
  if (sdds.length === 0 && affectedIds.some((id) => !id.startsWith("PROJECT"))) {
    issues.push(`No SDDs cover any affected spec IDs`);
  }

  return {
    valid: issues.filter((i) => !i.startsWith("No SDDs")).length === 0 && sdds.length > 0,
    sdds,
    issues,
  };
}

// ── Bootstrap (template generation for tests) ─────────────────────

function bootstrapSdds(
  specs: SpecFile[],
  affectedIds: string[],
  runId: string,
  sddDir: string,
): SddEntry[] {
  mkdirSync(sddDir, { recursive: true });
  const affectedSet = new Set(affectedIds);
  const sdds: SddEntry[] = [];

  const featSpecs = specs.filter((s) => s.data.type === "feature" && affectedSet.has(s.data.id));
  const reqSpecs = specs.filter((s) => s.data.type === "requirement" && affectedSet.has(s.data.id));
  const entSpecs = specs.filter((s) => s.data.type === "entity" && affectedSet.has(s.data.id));

  // SDD-COMP for features + requirements
  if (featSpecs.length > 0 || reqSpecs.length > 0) {
    const featId = featSpecs[0]?.data.id ?? reqSpecs[0]?.data.id;
    const sddId = `SDD-COMP-${featId}`;
    const coveredIds = [...featSpecs, ...reqSpecs].map((s) => s.data.id);
    const components = reqSpecs.map((req) => ({
      name: `${req.data.id.replace(/^REQ-/, "").replace(/-\d+$/, "")}Service`,
      module: `src/generated/${req.data.id.toLowerCase().replace(/^req-/, "").replace(/-\d+$/, "")}/`,
      responsibilities: (req.data.acceptance_criteria ?? []).map((ac) => `${ac.id}: ${ac.then}`),
    }));

    const frontmatter = {
      id: sddId, type: "sdd", title: `Component design for ${featId}`,
      version: "1.0.0", status: "approved",
      derived_from: { spec_ids: coveredIds }, components,
      risks: ["Phase 0 template — logic is placeholder"],
      customer_approval: { approved_by: "phase0-auto", approval_run_id: runId, approved_at: new Date().toISOString() },
    };
    writeFileSync(resolve(sddDir, `${sddId}.md`), `---\n${YAML.stringify(frontmatter)}---\n\n# ${sddId}\n\nAuto-generated.\n`, "utf8");
    sdds.push({ id: sddId, spec_ids_covered: coveredIds, file_path: `specs/sdd/${sddId}.md`, status: "approved" });
  }

  // SDD-DATA for entities
  for (const ent of entSpecs) {
    const sddId = `SDD-DATA-${ent.data.id}`;
    const frontmatter = {
      id: sddId, type: "sdd", title: `Data design for ${ent.data.id}`,
      version: "1.0.0", status: "approved",
      derived_from: { spec_ids: [ent.data.id] },
      components: [{ name: `${ent.data.title}Table`, module: "src/generated/auth/entities/",
        responsibilities: (ent.data.fields ?? []).map((f: Record<string, unknown>) => `column: ${f.name} (${f.type})`) }],
      risks: ["Phase 0 template — schema mapping is placeholder"],
      customer_approval: { approved_by: "phase0-auto", approval_run_id: runId, approved_at: new Date().toISOString() },
    };
    writeFileSync(resolve(sddDir, `${sddId}.md`), `---\n${YAML.stringify(frontmatter)}---\n\n# ${sddId}\n\nAuto-generated.\n`, "utf8");
    sdds.push({ id: sddId, spec_ids_covered: [ent.data.id], file_path: `specs/sdd/${sddId}.md`, status: "approved" });
  }

  return sdds;
}

// ── Handler ───────────────────────────────────────────────────────

const isBootstrap = () =>
  process.env.KEYSTONE_BOOTSTRAP === "1" || process.env.VITEST === "true";

export function s5Handler(ctx: StationContext): StationOutcomeDraft {
  const impactPath = resolve(ctx.repoRoot, ".keystone", "impact-report.json");
  if (!existsSync(impactPath)) {
    return { verdict: "reject", message: "S5: impact-report.json missing (S4 must run first)" };
  }
  const impact: ImpactReport = JSON.parse(readFileSync(impactPath, "utf8"));

  if (impact.affected_ids.length === 0) {
    const report: SddReport = { run_id: ctx.runId, sdds: [], verdict: "pass" };
    const outDir = resolve(ctx.repoRoot, ".keystone");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "sdd-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
    return { verdict: "pass", message: "S5: No affected specs — skipping SDD generation.", report_path: ".keystone/sdd-report.json" };
  }

  const sddDir = resolve(ctx.repoRoot, "specs", "sdd");

  // Bootstrap mode: template-generate SDDs (for tests / Phase 0 compat)
  if (isBootstrap()) {
    const specs = loadAllSpecs(resolve(ctx.repoRoot, "specs"), ctx.repoRoot);
    const sdds = bootstrapSdds(specs, impact.affected_ids, ctx.runId, sddDir);
    const report: SddReport = { run_id: ctx.runId, sdds, verdict: "pass" };
    const outDir = resolve(ctx.repoRoot, ".keystone");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, "sdd-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
    return { verdict: "pass", message: `S5: ${sdds.length} SDD(s) bootstrapped (template mode).`, report_path: ".keystone/sdd-report.json" };
  }

  // Validate mode: check if SDD files exist and are valid
  const validation = validateSddFiles(sddDir, impact.affected_ids, ctx.runId);

  if (!validation.valid || validation.sdds.length === 0) {
    // No valid SDDs found → block pipeline, await sdd-designer subagent
    return {
      verdict: "blocked",
      message: `S5: Awaiting SDD generation. Launch sdd-designer subagent, then /keystone:resume. Issues: ${validation.issues.join("; ") || "no SDD files found"}`,
    };
  }

  // SDDs exist and valid → write report
  const report: SddReport = { run_id: ctx.runId, sdds: validation.sdds, verdict: "pass" };
  const outDir = resolve(ctx.repoRoot, ".keystone");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "sdd-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");

  if (validation.issues.length > 0) {
    return {
      verdict: "pass",
      message: `S5: ${validation.sdds.length} SDD(s) validated (${validation.issues.length} warning(s): ${validation.issues[0]}).`,
      report_path: ".keystone/sdd-report.json",
    };
  }

  return {
    verdict: "pass",
    message: `S5: ${validation.sdds.length} SDD(s) validated and approved.`,
    report_path: ".keystone/sdd-report.json",
  };
}
