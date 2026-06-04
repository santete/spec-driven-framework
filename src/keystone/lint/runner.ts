import type { ValidateFunction } from "ajv/dist/2020.js";
import type { SpecFile } from "../types.js";
import type { Violation } from "./types.js";
import { checkSR1 } from "./rules/sr1-unique-id.js";
import { checkSR3 } from "./rules/sr3-no-orphan-refs.js";
import { checkSR4 } from "./rules/sr4-schema-valid.js";
import { checkSR6 } from "./rules/sr6-must-has-ac.js";

/**
 * Run all Phase 0 M2 spec-lint rules.
 *
 * Implemented: SR1, SR3, SR4, SR6.
 * Deferred to later milestones (need baseline/history):
 *   SR2 (ID immutable), SR5 (OpenAPI ref resolve), SR7–SR9 (evolution).
 */
export function runLint(
  specs: SpecFile[],
  validate: ValidateFunction,
): Violation[] {
  return [
    ...checkSR1(specs),
    ...checkSR3(specs),
    ...checkSR4(specs, validate),
    ...checkSR6(specs),
  ];
}
