import type { ValidateFunction } from "ajv/dist/2020.js";
import type { SpecFile } from "../../types.js";
import type { Violation } from "../types.js";
import { validateFrontmatter } from "../../spec/validator.js";

/**
 * SR4 — Frontmatter validate bằng JSON Schema bộ trước khi merge (PRD §8.3).
 */
export function checkSR4(specs: SpecFile[], validate: ValidateFunction): Violation[] {
  const violations: Violation[] = [];
  for (const s of specs) {
    const errors = validateFrontmatter(s.data, validate);
    for (const e of errors) {
      violations.push({
        spec_path: s.relPath,
        id: s.data.id ?? "(unknown)",
        criterion: "SR4",
        severity: "blocker",
        field: e.instancePath,
        message: e.message,
        suggestion: "Sửa frontmatter cho khớp spec-schema.json",
      });
    }
  }
  return violations;
}
