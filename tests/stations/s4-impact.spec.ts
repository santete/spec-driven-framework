import { describe, it, expect } from "vitest";
import { computeImpact } from "../../src/keystone/stations/s4-impact.js";
import type { BaselineSpecs } from "../../src/keystone/stations/types.js";

const fakeSpecs = [
  { data: { id: "FEAT-A", type: "feature", title: "Feature A", version: "1.0.0" }, relPath: "specs/FEAT-A.md", raw: "content-a" },
  { data: { id: "REQ-B", type: "requirement", title: "Req B", version: "1.0.0", priority: "must" as const }, relPath: "specs/REQ-B.md", raw: "content-b" },
];

describe("S4 — Impact Analysis", () => {
  it("marks all specs as added when no baseline", () => {
    const { report, newBaseline } = computeImpact(fakeSpecs, null, "run-001");
    expect(report.classification).toBe("additive");
    expect(report.changes).toHaveLength(2);
    expect(report.changes.every((c) => c.op === "added")).toBe(true);
    expect(report.changes.every((c) => c.change_classification === "additive")).toBe(true);
    expect(Object.keys(newBaseline.hashes)).toHaveLength(2);
    // Frontmatter stored for future diffs
    expect(newBaseline.frontmatter).toBeDefined();
    expect(newBaseline.frontmatter!["FEAT-A"]).toBeDefined();
  });

  it("detects modified specs with field-level diffs", () => {
    // Build baseline from first version
    const { newBaseline: baseline } = computeImpact(fakeSpecs, null, "run-init");

    // Modify specs — change title (cosmetic) + priority (structural)
    const modified = [
      { data: { id: "FEAT-A", type: "feature", title: "Feature A Updated", version: "1.1.0" }, relPath: "specs/FEAT-A.md", raw: "content-a-modified" },
      { data: { id: "REQ-B", type: "requirement", title: "Req B", version: "1.0.0", priority: "should" as const }, relPath: "specs/REQ-B.md", raw: "content-b-modified" },
    ];

    const { report } = computeImpact(modified, baseline, "run-002");
    expect(report.changes.every((c) => c.op === "modified")).toBe(true);

    // FEAT-A: title + version changed = cosmetic (title) + additive (version)
    const featDiff = report.changes.find((c) => c.id === "FEAT-A")!;
    expect(featDiff.field_diffs).toBeDefined();
    expect(featDiff.field_diffs!.some((d) => d.field === "title")).toBe(true);

    // REQ-B: priority changed = structural field change = additive
    const reqDiff = report.changes.find((c) => c.id === "REQ-B")!;
    expect(reqDiff.field_diffs!.some((d) => d.field === "priority")).toBe(true);
  });

  it("classifies removal as breaking", () => {
    const { newBaseline: baseline } = computeImpact(fakeSpecs, null, "run-init");
    // Remove FEAT-A, keep REQ-B
    const fewer = [fakeSpecs[1]];
    const { report } = computeImpact(fewer, baseline, "run-003");

    const removed = report.changes.find((c) => c.id === "FEAT-A");
    expect(removed).toBeDefined();
    expect(removed!.op).toBe("removed");
    expect(removed!.change_classification).toBe("breaking");
    expect(report.classification).toBe("breaking");
  });

  it("returns cosmetic when nothing changed", () => {
    const { newBaseline } = computeImpact(fakeSpecs, null, "run-init");
    const { report } = computeImpact(fakeSpecs, newBaseline, "run-004");
    expect(report.changes).toHaveLength(0);
    expect(report.classification).toBe("cosmetic");
  });

  it("classifies structural field removal as breaking", () => {
    const specsWithAC = [
      {
        data: { id: "REQ-X", type: "requirement", title: "X", version: "1.0.0", priority: "must" as const,
          acceptance_criteria: [{ id: "AC-X-01", given: "g", when: "w", then: "t" }] },
        relPath: "specs/REQ-X.md", raw: "v1",
      },
    ];
    const { newBaseline } = computeImpact(specsWithAC, null, "run-init");

    // Remove acceptance_criteria (structural field)
    const specsWithoutAC = [
      { data: { id: "REQ-X", type: "requirement", title: "X", version: "2.0.0", priority: "must" as const },
        relPath: "specs/REQ-X.md", raw: "v2" },
    ];
    const { report } = computeImpact(specsWithoutAC, newBaseline, "run-005");

    const change = report.changes[0];
    expect(change.change_classification).toBe("breaking");
    expect(change.field_diffs!.some((d) => d.field === "acceptance_criteria" && d.action === "removed")).toBe(true);
  });
});
