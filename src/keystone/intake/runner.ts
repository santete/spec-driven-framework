import type { ValidateFunction } from "ajv/dist/2020.js";
import type { SpecFile } from "../types.js";
import type { Violation } from "../lint/types.js";
import type { IntakeReport } from "./types.js";
import { runLint } from "../lint/runner.js";
import { findProject } from "../spec/loader.js";
import { checkIQ1 } from "./checks/iq1-completeness.js";
import { checkIQ2 } from "./checks/iq2-clarity.js";
import { checkIQ3 } from "./checks/iq3-feasibility.js";
import { checkIQ4 } from "./checks/iq4-resolvability.js";
import { checkIQ6 } from "./checks/iq6-nfr-measurability.js";
import { checkIQ7 } from "./checks/iq7-project-compatibility.js";
import { checkIQ8 } from "./checks/iq8-project-artifact-present.js";

/**
 * Run S0 Intake QC: SR1–SR9 + IQ1–IQ8 over a set of specs.
 *
 * Phase 0 M2: implements SR1, SR3, SR4, SR6 + IQ1, IQ2, IQ3, IQ4, IQ6, IQ7, IQ8.
 * IQ5 (semver consistency) requires baseline diff → deferred to M4 (semantic-diff).
 *
 * `runId` is required so reports are auditable; CLI generates one if not provided.
 */
export function runIntakeQc(
  specs: SpecFile[],
  validate: ValidateFunction,
  runId: string,
): IntakeReport {
  const project = findProject(specs)?.data;

  const violations: Violation[] = [
    ...runLint(specs, validate),
    ...checkIQ1(specs),
    ...checkIQ2(specs),
    ...checkIQ3(specs),
    ...checkIQ4(specs),
    ...checkIQ6(specs),
    ...checkIQ7(specs, project),
    ...checkIQ8(specs),
  ];

  const blockers = violations.filter((v) => v.severity === "blocker");
  const verdict = blockers.length === 0 ? "pass" : "reject";

  return {
    $schema: ".keystone/intake-report-schema.json",
    run_id: runId,
    verdict,
    summary:
      verdict === "pass"
        ? `Tất cả ${specs.length} spec đạt S0 intake QC.`
        : `${blockers.length} blocker / ${violations.length} vi phạm trên ${specs.length} spec.`,
    total_items: violations.length,
    items: violations,
    next_action:
      verdict === "pass"
        ? "Pipeline có thể tiến vào S1 (Spec layer)."
        : `Customer sửa spec rồi chạy \`/keystone:S0:resume ${runId}\`.`,
  };
}
