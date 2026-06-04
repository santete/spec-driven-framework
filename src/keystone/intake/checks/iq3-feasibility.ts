import type { SpecFile } from "../../types.js";
import type { Violation } from "../../lint/types.js";

/**
 * IQ3 — Feasibility (PRD §9.0): Phase 0 M2 hiện thực phần "depends_on resolve được"
 * (overlap với SR3 nhưng giữ riêng để báo theo criterion IQ).
 *
 * Phần "không yêu cầu mâu thuẫn với invariants ENT đã tồn tại" và
 * "không yêu cầu vượt NFR budget của project" cần phân tích sâu hơn, hoãn M3+.
 */
export function checkIQ3(specs: SpecFile[]): Violation[] {
  const violations: Violation[] = [];
  const ids = new Set<string>();
  for (const s of specs) if (s.data.id) ids.add(s.data.id);

  for (const s of specs) {
    if (!s.data.id) continue;
    const deps = s.data.relations?.depends_on;
    if (!Array.isArray(deps)) continue;
    for (const dep of deps) {
      if (typeof dep !== "string") continue;
      if (!ids.has(dep)) {
        violations.push({
          spec_path: s.relPath,
          id: s.data.id,
          criterion: "IQ3",
          severity: "blocker",
          field: "relations.depends_on",
          message: `Dependency '${dep}' không tồn tại trong repo (không feasibility)`,
          suggestion: `Tạo spec '${dep}' trước, hoặc bỏ dependency`,
        });
      }
    }
  }
  return violations;
}
