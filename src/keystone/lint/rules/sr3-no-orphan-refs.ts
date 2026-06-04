import type { SpecFile } from "../../types.js";
import type { Violation } from "../types.js";

const RELATION_KEYS = ["refines", "depends_on", "satisfies", "verifies", "supersedes"] as const;

/**
 * SR3 — Không reference mồ côi: mọi relation phải trỏ tới ID tồn tại (PRD §8.1).
 */
export function checkSR3(specs: SpecFile[]): Violation[] {
  const existingIds = new Set<string>();
  for (const s of specs) {
    if (s.data.id) existingIds.add(s.data.id);
  }
  const violations: Violation[] = [];
  for (const s of specs) {
    const rel = s.data.relations;
    if (!rel) continue;
    for (const key of RELATION_KEYS) {
      const targets = rel[key];
      if (!Array.isArray(targets)) continue;
      for (const target of targets) {
        if (typeof target !== "string") continue;
        if (!existingIds.has(target)) {
          violations.push({
            spec_path: s.relPath,
            id: s.data.id,
            criterion: "SR3",
            severity: "blocker",
            field: `relations.${key}`,
            message: `Orphan reference: '${target}' không tồn tại trong repo`,
            suggestion: `Kiểm tra chính tả ID hoặc tạo spec '${target}' trước`,
          });
        }
      }
    }
  }
  return violations;
}
