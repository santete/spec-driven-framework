import type { SpecFile } from "../../types.js";
import type { Violation } from "../types.js";

/**
 * SR6 — Mọi REQ priority `must` phải có tối thiểu một acceptance_criterion (PRD §8.3).
 *
 * Lưu ý: spec-schema cũng cưỡng chế điều này qua allOf if/then. SR6 là double-check
 * ở lint layer để có message rõ ràng + suggestion phù hợp.
 */
export function checkSR6(specs: SpecFile[]): Violation[] {
  const violations: Violation[] = [];
  for (const s of specs) {
    if (s.data.type !== "requirement") continue;
    if (s.data.priority !== "must") continue;
    const ac = s.data.acceptance_criteria;
    if (!Array.isArray(ac) || ac.length === 0) {
      violations.push({
        spec_path: s.relPath,
        id: s.data.id,
        criterion: "SR6",
        severity: "blocker",
        field: "acceptance_criteria",
        message: `REQ '${s.data.id}' priority=must thiếu acceptance_criteria`,
        suggestion: "Thêm ≥ 1 AC dạng Given/When/Then; xem ví dụ AC-AUTH-001-01",
      });
    }
  }
  return violations;
}
