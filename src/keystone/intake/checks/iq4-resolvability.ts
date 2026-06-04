import type { SpecFile } from "../../types.js";
import type { Violation } from "../../lint/types.js";

/**
 * IQ4 — Resolvability (PRD §9.0):
 *   - Mọi *_ref / schema_ref / openapi_ref resolve được.
 *
 * Phase 0 M2 chỉ check field-level reference vào IDs trong repo. Phần "file
 * openapi_ref đọc được" cần I/O check, hoãn khi có API spec đầu tiên (M4).
 */
export function checkIQ4(specs: SpecFile[]): Violation[] {
  const violations: Violation[] = [];
  const ids = new Set<string>();
  for (const s of specs) if (s.data.id) ids.add(s.data.id);

  for (const s of specs) {
    if (!s.data.id) continue;
    walk(s.data as unknown, "", (path, value) => {
      if (typeof value !== "string") return;
      if (!path.endsWith("_ref") && !path.endsWith("schema_ref")) return;
      if (path === "openapi_ref") return; // file-path, not ID — skip in M2
      if (!ids.has(value)) {
        violations.push({
          spec_path: s.relPath,
          id: s.data.id,
          criterion: "IQ4",
          severity: "blocker",
          field: path,
          message: `Reference '${value}' không tồn tại`,
          suggestion: `Tạo spec '${value}' hoặc sửa ref`,
        });
      }
    });
  }
  return violations;
}

function walk(
  obj: unknown,
  path: string,
  visit: (path: string, value: unknown) => void,
): void {
  if (obj === null || obj === undefined) return;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walk(v, `${path}[${i}]`, visit));
    return;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const next = path ? `${path}.${k}` : k;
      visit(next, v);
      walk(v, next, visit);
    }
    return;
  }
}
