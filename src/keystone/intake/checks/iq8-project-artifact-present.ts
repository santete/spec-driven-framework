import type { SpecFile } from "../../types.js";
import type { Violation } from "../../lint/types.js";

/**
 * IQ8 — Project artifact present (PRD §9.0, SR10):
 *   - Đúng 1 PROJECT artifact tồn tại
 *   - status = approved
 *   - profile_source = catalog (Phase 1 cưỡng chế SR20)
 */
export function checkIQ8(specs: SpecFile[]): Violation[] {
  const violations: Violation[] = [];
  const projects = specs.filter((s) => s.data.type === "project");

  if (projects.length === 0) {
    violations.push({
      spec_path: "(repo)",
      id: "(missing)",
      criterion: "IQ8",
      severity: "blocker",
      field: "type=project",
      message: "Repo thiếu PROJECT artifact (SR10 — phải có đúng 1)",
      suggestion: "Tạo specs/project.md với type=project + profile + stack",
    });
    return violations;
  }

  if (projects.length > 1) {
    for (const p of projects) {
      violations.push({
        spec_path: p.relPath,
        id: p.data.id,
        criterion: "IQ8",
        severity: "blocker",
        field: "type=project",
        message: `Repo có ${projects.length} PROJECT artifact (SR10: phải đúng 1)`,
        suggestion: "Xoá bớt PROJECT thừa hoặc gộp lại",
      });
    }
    return violations;
  }

  const proj = projects[0];
  if (proj.data.status !== "approved") {
    violations.push({
      spec_path: proj.relPath,
      id: proj.data.id,
      criterion: "IQ8",
      severity: "blocker",
      field: "status",
      message: `PROJECT artifact phải có status=approved (hiện tại '${proj.data.status ?? "?"}')`,
      suggestion: "Đặt status: approved khi PROJECT đã được team đồng thuận",
    });
  }

  const ps = proj.data.profile_source ?? "catalog";
  if (ps !== "catalog") {
    violations.push({
      spec_path: proj.relPath,
      id: proj.data.id,
      criterion: "IQ8",
      severity: "blocker",
      field: "profile_source",
      message: `Phase 1 cưỡng chế profile_source='catalog' (hiện tại '${ps}', SR20)`,
      suggestion: "Đặt profile_source: catalog; custom_repo mở ở Phase 2 qua certification gate §15.4",
    });
  }

  return violations;
}
