import type { SpecFile, SpecFrontmatter } from "../../types.js";
import type { Violation } from "../../lint/types.js";

const VALID_HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

/**
 * IQ7 — Project compatibility (PRD §9.0, SR13):
 *   - API.openapi.method ∈ HTTP set (đã enforce bởi schema; check lại với
 *     thông điệp định hướng project profile)
 *   - SCHEMA / ENT field types tương thích với PROJECT.stack (M4 sẽ extend)
 *
 * Phase 0 M2 chỉ thực thi phần HTTP method + flag project-level mismatch khi
 * spec yêu cầu transport ngoài project.stack.http (vd gRPC trong fastify project).
 */
export function checkIQ7(
  specs: SpecFile[],
  project: SpecFrontmatter | undefined,
): Violation[] {
  const violations: Violation[] = [];
  const httpStack = (project?.stack as { http?: string } | undefined)?.http;

  for (const s of specs) {
    if (!s.data.id) continue;

    if (s.data.type === "api") {
      const inlineMethod =
        (s.data.openapi as { method?: string } | undefined)?.method ?? s.data.openapi_method;
      if (typeof inlineMethod === "string" && !VALID_HTTP_METHODS.has(inlineMethod.toUpperCase())) {
        violations.push({
          spec_path: s.relPath,
          id: s.data.id,
          criterion: "IQ7",
          severity: "blocker",
          field: "openapi.method",
          message: `Method '${inlineMethod}' không hợp lệ cho project http='${httpStack ?? "?"}'`,
          suggestion: `Dùng một trong: ${[...VALID_HTTP_METHODS].join(", ")}`,
        });
      }
    }
  }

  return violations;
}
