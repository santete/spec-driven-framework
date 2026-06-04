import type { SpecFile } from "../../types.js";
import type { Violation } from "../../lint/types.js";

const FORBIDDEN_TOKENS = ["TBD", "TODO", "???"];
const GWT_KEYS = ["given", "when", "then"] as const;

/**
 * IQ2 — Clarity (PRD §9.0):
 *   - AC theo Given/When/Then đúng cú pháp (3 trường non-empty)
 *   - Cấm token TBD/TODO/??? trong frontmatter
 *   - Mọi enum value mô tả ít nhất 3 ký tự (Phase 0: skip vì chưa có spec dùng enum desc)
 */
export function checkIQ2(specs: SpecFile[]): Violation[] {
  const violations: Violation[] = [];
  for (const s of specs) {
    if (!s.data.id) continue;
    const frontmatterText = JSON.stringify(s.data);
    for (const token of FORBIDDEN_TOKENS) {
      if (frontmatterText.includes(token)) {
        violations.push({
          spec_path: s.relPath,
          id: s.data.id,
          criterion: "IQ2",
          severity: "blocker",
          field: "(frontmatter)",
          message: `Frontmatter chứa token cấm '${token}' — chưa đủ rõ`,
          suggestion: `Thay '${token}' bằng nội dung cụ thể, hoặc tách spec thành PR riêng khi chưa sẵn`,
        });
      }
    }

    if (Array.isArray(s.data.acceptance_criteria)) {
      for (const ac of s.data.acceptance_criteria) {
        if (!ac || typeof ac !== "object") continue;
        for (const key of GWT_KEYS) {
          const val = (ac as unknown as Record<string, unknown>)[key];
          if (typeof val !== "string" || val.trim().length === 0) {
            violations.push({
              spec_path: s.relPath,
              id: s.data.id,
              criterion: "IQ2",
              severity: "blocker",
              field: `acceptance_criteria.${(ac as { id?: string }).id ?? "?"}.${key}`,
              message: `AC '${(ac as { id?: string }).id ?? "?"}' thiếu '${key}' (Given/When/Then phải đầy đủ)`,
              suggestion: "Điền cả 3 trường given/when/then bằng câu mô tả",
            });
          }
        }
      }
    }
  }
  return violations;
}
