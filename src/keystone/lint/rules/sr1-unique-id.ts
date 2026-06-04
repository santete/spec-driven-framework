import type { SpecFile } from "../../types.js";
import type { Violation } from "../types.js";

/**
 * SR1 — ID là duy nhất toàn repo (PRD §8.1).
 * Phát hiện cùng ID xuất hiện trong nhiều file → tất cả các file đụng độ đều
 * báo violation (để user biết phải dedupe ở đâu).
 */
export function checkSR1(specs: SpecFile[]): Violation[] {
  const byId = new Map<string, SpecFile[]>();
  for (const s of specs) {
    const id = s.data.id;
    if (!id) continue;
    const list = byId.get(id) ?? [];
    list.push(s);
    byId.set(id, list);
  }
  const violations: Violation[] = [];
  for (const [id, files] of byId) {
    if (files.length < 2) continue;
    const paths = files.map((f) => f.relPath).sort();
    for (const f of files) {
      violations.push({
        spec_path: f.relPath,
        id,
        criterion: "SR1",
        severity: "blocker",
        field: "id",
        message: `ID '${id}' xuất hiện trong ${files.length} file: ${paths.join(", ")}`,
        suggestion: `Đổi ID ở một trong các file (không tái dùng ID — chỉ deprecate/supersede ID cũ §8.4)`,
      });
    }
  }
  return violations;
}
