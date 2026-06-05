import { describe, it, expect } from "vitest";
import { computeImpact } from "../../src/keystone/stations/s4-impact.js";

const fakeSpecs = [
  { data: { id: "FEAT-A", type: "feature" }, relPath: "specs/FEAT-A.md", raw: "content-a" },
  { data: { id: "REQ-B", type: "requirement" }, relPath: "specs/REQ-B.md", raw: "content-b" },
];

describe("S4 — Impact Analysis", () => {
  it("marks all specs as added when no baseline", () => {
    const { report, newBaseline } = computeImpact(fakeSpecs, null, "run-001");
    expect(report.classification).toBe("additive");
    expect(report.changes).toHaveLength(2);
    expect(report.changes.every((c) => c.op === "added")).toBe(true);
    expect(report.affected_ids).toEqual(["FEAT-A", "REQ-B"]);
    expect(Object.keys(newBaseline.hashes)).toHaveLength(2);
  });

  it("detects modified specs", () => {
    const baseline = {
      version: 1 as const,
      hashes: { "FEAT-A": "old-hash", "REQ-B": "old-hash" },
    };
    const { report } = computeImpact(fakeSpecs, baseline, "run-002");
    expect(report.changes.every((c) => c.op === "modified")).toBe(true);
    expect(report.classification).toBe("additive");
  });

  it("detects removed specs", () => {
    const baseline = {
      version: 1 as const,
      hashes: { "FEAT-A": "x", "REQ-B": "y", "FEAT-GONE": "z" },
    };
    const { report } = computeImpact(fakeSpecs, baseline, "run-003");
    const removed = report.changes.find((c) => c.id === "FEAT-GONE");
    expect(removed).toBeDefined();
    expect(removed!.op).toBe("removed");
    expect(report.classification).toBe("breaking");
  });

  it("returns cosmetic when nothing changed", () => {
    // Build baseline from same specs
    const { newBaseline } = computeImpact(fakeSpecs, null, "run-init");
    const { report } = computeImpact(fakeSpecs, newBaseline, "run-004");
    expect(report.changes).toHaveLength(0);
    expect(report.classification).toBe("cosmetic");
  });
});
