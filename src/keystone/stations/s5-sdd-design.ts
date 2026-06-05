/**
 * S5 — SDD Design: generate Software Design Documents from specs.
 * PRD §7.1 S5, §8.2.8 SDD artifacts, gate G_SDD.
 *
 * Phase 0 M4: template-based, auto-approved.
 * Generates SDD-COMP (component) and SDD-DATA (data schema) from affected specs.
 */
import { resolve } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import YAML from "yaml";
import type { StationContext, StationOutcomeDraft } from "../orchestrator/stations.js";
import type { ImpactReport, SddReport, SddEntry } from "./types.js";
import type { SpecFile } from "../types.js";
import { loadAllSpecs, findProject } from "../spec/loader.js";

function generateSddComp(
  featSpecs: SpecFile[],
  reqSpecs: SpecFile[],
  runId: string,
): { id: string; content: string } | null {
  if (featSpecs.length === 0 && reqSpecs.length === 0) return null;

  const featId = featSpecs[0]?.data.id ?? reqSpecs[0]?.data.id;
  const sddId = `SDD-COMP-${featId}`;
  const coveredIds = [
    ...featSpecs.map((s) => s.data.id),
    ...reqSpecs.map((s) => s.data.id),
  ];

  const components = reqSpecs.map((req) => ({
    name: `${req.data.id.replace(/^REQ-/, "").replace(/-\d+$/, "")}Service`,
    module: `src/generated/${req.data.id.toLowerCase().replace(/^req-/, "").replace(/-\d+$/, "")}/`,
    responsibilities: (req.data.acceptance_criteria ?? []).map(
      (ac) => `${ac.id}: ${ac.then}`,
    ),
  }));

  const frontmatter = {
    id: sddId,
    type: "sdd",
    title: `Component design for ${featId}`,
    version: "1.0.0",
    status: "approved",
    derived_from: { spec_ids: coveredIds },
    components,
    risks: ["Phase 0 template — logic is placeholder"],
    customer_approval: {
      approved_by: "phase0-auto",
      approval_run_id: runId,
      approved_at: new Date().toISOString(),
    },
  };

  const content = `---\n${YAML.stringify(frontmatter)}---\n\n# ${sddId}\n\nAuto-generated component design for Phase 0 validation.\n`;
  return { id: sddId, content };
}

function generateSddData(
  entSpecs: SpecFile[],
  runId: string,
): { id: string; content: string }[] {
  return entSpecs.map((ent) => {
    const sddId = `SDD-DATA-${ent.data.id}`;
    const frontmatter = {
      id: sddId,
      type: "sdd",
      title: `Data design for ${ent.data.id}`,
      version: "1.0.0",
      status: "approved",
      derived_from: { spec_ids: [ent.data.id] },
      components: [
        {
          name: `${ent.data.title}Table`,
          module: "src/generated/auth/entities/",
          responsibilities: (ent.data.fields ?? []).map(
            (f: Record<string, unknown>) => `column: ${f.name} (${f.type})`,
          ),
        },
      ],
      risks: ["Phase 0 template — schema mapping is placeholder"],
      customer_approval: {
        approved_by: "phase0-auto",
        approval_run_id: runId,
        approved_at: new Date().toISOString(),
      },
    };

    const content = `---\n${YAML.stringify(frontmatter)}---\n\n# ${sddId}\n\nAuto-generated data design for Phase 0 validation.\n`;
    return { id: sddId, content };
  });
}

export function s5Handler(ctx: StationContext): StationOutcomeDraft {
  // Read impact report
  const impactPath = resolve(ctx.repoRoot, ".keystone", "impact-report.json");
  if (!existsSync(impactPath)) {
    return { verdict: "reject", message: "S5: impact-report.json missing (S4 must run first)" };
  }
  const impact: ImpactReport = JSON.parse(readFileSync(impactPath, "utf8"));

  if (impact.affected_ids.length === 0) {
    // Nothing to design — cosmetic change
    const report: SddReport = { run_id: ctx.runId, sdds: [], verdict: "pass" };
    const outDir = resolve(ctx.repoRoot, ".keystone");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      resolve(outDir, "sdd-report.json"),
      JSON.stringify(report, null, 2) + "\n",
      "utf8",
    );
    return { verdict: "pass", message: "S5: No affected specs — skipping SDD generation.", report_path: ".keystone/sdd-report.json" };
  }

  // Load specs
  const specs = loadAllSpecs(resolve(ctx.repoRoot, "specs"), ctx.repoRoot);
  const affectedSet = new Set(impact.affected_ids);

  const featSpecs = specs.filter(
    (s) => s.data.type === "feature" && affectedSet.has(s.data.id),
  );
  const reqSpecs = specs.filter(
    (s) => s.data.type === "requirement" && affectedSet.has(s.data.id),
  );
  const entSpecs = specs.filter(
    (s) => s.data.type === "entity" && affectedSet.has(s.data.id),
  );

  // Generate SDDs
  const sddDir = resolve(ctx.repoRoot, "specs", "sdd");
  mkdirSync(sddDir, { recursive: true });

  const sdds: SddEntry[] = [];

  const comp = generateSddComp(featSpecs, reqSpecs, ctx.runId);
  if (comp) {
    const sddPath = resolve(sddDir, `${comp.id}.md`);
    writeFileSync(sddPath, comp.content, "utf8");
    sdds.push({
      id: comp.id,
      spec_ids_covered: [...featSpecs, ...reqSpecs].map((s) => s.data.id),
      file_path: `specs/sdd/${comp.id}.md`,
      status: "approved",
    });
  }

  for (const data of generateSddData(entSpecs, ctx.runId)) {
    const sddPath = resolve(sddDir, `${data.id}.md`);
    writeFileSync(sddPath, data.content, "utf8");
    sdds.push({
      id: data.id,
      spec_ids_covered: [data.id.replace("SDD-DATA-", "")],
      file_path: `specs/sdd/${data.id}.md`,
      status: "approved",
    });
  }

  const report: SddReport = { run_id: ctx.runId, sdds, verdict: "pass" };
  const outDir = resolve(ctx.repoRoot, ".keystone");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    resolve(outDir, "sdd-report.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );

  return {
    verdict: "pass",
    message: `S5: ${sdds.length} SDD(s) generated and auto-approved.`,
    report_path: ".keystone/sdd-report.json",
  };
}
