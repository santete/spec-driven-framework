import { describe, it, expect } from "vitest";
import { runGovernance } from "../../src/keystone/stations/s3-governance.js";
import type { Violation } from "../../src/keystone/lint/types.js";

describe("S3 — Governance", () => {
  it("passes with no blockers on additive change", () => {
    const violations: Violation[] = [
      { spec_path: "a.md", id: "X", criterion: "SR1", severity: "warning", field: "id", message: "w" },
    ];
    const report = runGovernance(violations, "run-001", "additive");
    expect(report.verdict).toBe("pass");
    expect(report.adr_required).toBe(false);
    expect(report.semver_ok).toBe(true);
  });

  it("rejects when blockers exist", () => {
    const violations: Violation[] = [
      { spec_path: "a.md", id: "X", criterion: "SR4", severity: "blocker", field: "id", message: "bad" },
    ];
    const report = runGovernance(violations, "run-001", "additive");
    expect(report.verdict).toBe("reject");
    expect(report.lint_blockers).toBe(1);
  });

  it("requires ADR for breaking changes", () => {
    const violations: Violation[] = [];
    const report = runGovernance(violations, "run-001", "breaking");
    expect(report.adr_required).toBe(true);
    // No ADR present in Phase 1 → reject
    expect(report.verdict).toBe("reject");
  });
});
