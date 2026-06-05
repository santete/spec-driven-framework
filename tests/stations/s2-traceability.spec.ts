import { describe, it, expect } from "vitest";
import { buildTraceIndex } from "../../src/keystone/stations/s2-traceability.js";
import type { SpecGraph } from "../../src/keystone/stations/types.js";

describe("S2 — Traceability", () => {
  const graph: SpecGraph = {
    nodes: [
      { id: "FEAT-AUTH", type: "feature", version: "1.0.0", specPath: "specs/auth/FEAT-AUTH.md" },
      { id: "REQ-AUTH-001", type: "requirement", version: "1.2.0", specPath: "specs/auth/REQ-AUTH-001.md" },
    ],
    edges: [{ from: "REQ-AUTH-001", to: "FEAT-AUTH", relation: "refines" }],
    topologicalOrder: ["FEAT-AUTH", "REQ-AUTH-001"],
  };

  const specs = [
    { data: { id: "FEAT-AUTH", version: "1.0.0" }, relPath: "specs/auth/FEAT-AUTH.md", raw: "---\nid: FEAT-AUTH\n---\n" },
    { data: { id: "REQ-AUTH-001", version: "1.2.0" }, relPath: "specs/auth/REQ-AUTH-001.md", raw: "---\nid: REQ-AUTH-001\n---\n" },
  ];

  it("creates trace entries for all spec IDs", () => {
    const { index, report } = buildTraceIndex(graph, specs, "run-001");
    expect(index.entries).toHaveLength(2);
    expect(report.created).toBe(2);
    expect(report.updated).toBe(0);

    const feat = index.entries.find((e) => e.spec_id === "FEAT-AUTH");
    expect(feat).toBeDefined();
    expect(feat!.spec_version).toBe("1.0.0");
    expect(feat!.implementations).toEqual([]);
    expect(feat!.tests).toEqual([]);
    expect(feat!.last_run_id).toBe("run-001");
    expect(feat!.spec_content_hash).toBeTruthy();
  });

  it("updates existing entries preserving implementations", () => {
    const existing = {
      version: 1 as const,
      entries: [
        {
          spec_id: "FEAT-AUTH",
          spec_path: "specs/auth/FEAT-AUTH.md",
          spec_version: "0.9.0",
          spec_content_hash: "old-hash",
          implementations: ["src/auth/index.ts"],
          tests: ["tests/auth/index.spec.ts"],
          last_run_id: "run-000",
        },
      ],
    };

    const { index, report } = buildTraceIndex(graph, specs, "run-002", existing);
    expect(report.updated).toBe(1);
    expect(report.created).toBe(1);

    const feat = index.entries.find((e) => e.spec_id === "FEAT-AUTH")!;
    expect(feat.spec_version).toBe("1.0.0"); // updated
    expect(feat.implementations).toEqual(["src/auth/index.ts"]); // preserved
    expect(feat.last_run_id).toBe("run-002");
  });
});
