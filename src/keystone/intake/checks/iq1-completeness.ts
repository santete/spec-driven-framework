import type { SpecFile } from "../../types.js";
import type { Violation } from "../../lint/types.js";

/**
 * IQ1 — Completeness (PRD §9.0):
 *   - REQ priority=must có ≥ 1 AC
 *   - FEAT có ≥ 1 REQ refines (tức ≥ 1 spec REQ refines tới FEAT đó)
 *   - ENT có ≥ 1 invariant
 *   - API có request + ≥ 1 response schema
 *   - SDD có components không rỗng
 */
export function checkIQ1(specs: SpecFile[]): Violation[] {
  const violations: Violation[] = [];

  const refinesIndex = new Map<string, number>();
  for (const s of specs) {
    const refines = s.data.relations?.refines;
    if (!Array.isArray(refines)) continue;
    for (const target of refines) {
      if (typeof target !== "string") continue;
      refinesIndex.set(target, (refinesIndex.get(target) ?? 0) + 1);
    }
  }

  for (const s of specs) {
    const { id, type } = s.data;
    if (!id || !type) continue;

    if (type === "requirement" && s.data.priority === "must") {
      const ac = s.data.acceptance_criteria;
      if (!Array.isArray(ac) || ac.length === 0) {
        violations.push({
          spec_path: s.relPath,
          id,
          criterion: "IQ1",
          severity: "blocker",
          field: "acceptance_criteria",
          message: `REQ '${id}' priority=must cần ≥ 1 acceptance_criterion`,
          suggestion: "Thêm AC dạng Given/When/Then",
        });
      }
    }

    if (type === "feature") {
      const count = refinesIndex.get(id) ?? 0;
      if (count === 0) {
        violations.push({
          spec_path: s.relPath,
          id,
          criterion: "IQ1",
          severity: "blocker",
          field: "relations",
          message: `FEAT '${id}' chưa có REQ nào refines tới nó`,
          suggestion: `Tạo một REQ với relations.refines = ['${id}'] hoặc đánh dấu FEAT này deprecated`,
        });
      }
    }

    if (type === "entity") {
      const inv = s.data.invariants;
      if (!Array.isArray(inv) || inv.length === 0) {
        violations.push({
          spec_path: s.relPath,
          id,
          criterion: "IQ1",
          severity: "blocker",
          field: "invariants",
          message: `ENT '${id}' thiếu invariants`,
          suggestion: "Liệt kê ≥ 1 bất biến (vd 'email là duy nhất')",
        });
      }
    }

    if (type === "api") {
      const hasInline = !!s.data.openapi;
      const hasRef = !!s.data.openapi_ref;
      if (!hasInline && !hasRef) {
        violations.push({
          spec_path: s.relPath,
          id,
          criterion: "IQ1",
          severity: "blocker",
          field: "openapi",
          message: `API '${id}' thiếu hợp đồng OpenAPI (inline hoặc ref)`,
          suggestion: "Khai báo block 'openapi:' hoặc 'openapi_ref:' (§8.2.5)",
        });
      }
    }

    if (type === "sdd") {
      const comps = s.data.components;
      if (!Array.isArray(comps) || comps.length === 0) {
        violations.push({
          spec_path: s.relPath,
          id,
          criterion: "IQ1",
          severity: "blocker",
          field: "components",
          message: `SDD '${id}' thiếu components`,
          suggestion: "Phân rã thành ≥ 1 component (controller/service/repository...)",
        });
      }
    }
  }
  return violations;
}
