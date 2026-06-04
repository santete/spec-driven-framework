import type { SpecFile } from "../../types.js";
import type { Violation } from "../../lint/types.js";

const VAGUE_TOKENS = ["nhanh", "ổn định", "tốt", "hợp lý", "fast", "stable", "good"];

/**
 * IQ6 — NFR measurability (PRD §9.0):
 *   - budget.metric + budget.threshold (số) + budget.measured_by phải có
 *   - Cấm mô tả mơ hồ ("nhanh", "ổn định"...)
 */
export function checkIQ6(specs: SpecFile[]): Violation[] {
  const violations: Violation[] = [];
  for (const s of specs) {
    if (s.data.type !== "nfr") continue;
    if (!s.data.id) continue;
    const b = s.data.budget;
    if (!b) {
      violations.push({
        spec_path: s.relPath,
        id: s.data.id,
        criterion: "IQ6",
        severity: "blocker",
        field: "budget",
        message: `NFR '${s.data.id}' thiếu block budget`,
        suggestion: "Khai báo budget với metric / threshold (number) / measured_by",
      });
      continue;
    }
    if (typeof b.metric !== "string" || b.metric.trim().length === 0) {
      violations.push({
        spec_path: s.relPath,
        id: s.data.id,
        criterion: "IQ6",
        severity: "blocker",
        field: "budget.metric",
        message: "budget.metric thiếu hoặc không phải string",
        suggestion: "Đặt metric cụ thể (vd 'latency_p95_ms')",
      });
    }
    if (typeof b.threshold !== "number") {
      violations.push({
        spec_path: s.relPath,
        id: s.data.id,
        criterion: "IQ6",
        severity: "blocker",
        field: "budget.threshold",
        message: "budget.threshold phải là số định lượng",
        suggestion: "Đặt giá trị số (vd 300)",
      });
    }
    if (typeof b.measured_by !== "string" || b.measured_by.trim().length === 0) {
      violations.push({
        spec_path: s.relPath,
        id: s.data.id,
        criterion: "IQ6",
        severity: "blocker",
        field: "budget.measured_by",
        message: "budget.measured_by thiếu — phải mô tả phương pháp đo",
        suggestion: "Vd 'load test 1000 rps' hoặc 'k6 script tests/perf/login.js'",
      });
    } else {
      for (const vague of VAGUE_TOKENS) {
        const lower = b.measured_by.toLowerCase();
        if (lower.includes(vague)) {
          violations.push({
            spec_path: s.relPath,
            id: s.data.id,
            criterion: "IQ6",
            severity: "warning",
            field: "budget.measured_by",
            message: `budget.measured_by chứa token mơ hồ '${vague}'`,
            suggestion: "Mô tả công cụ + scenario cụ thể, không dùng tính từ chung chung",
          });
        }
      }
    }
  }
  return violations;
}
