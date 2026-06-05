import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { buildSpecGraph } from "../../src/keystone/stations/s1-spec-graph.js";
import { loadAllSpecs } from "../../src/keystone/spec/loader.js";
import { fakeSpec } from "../helpers/fakeSpec.js";

const ROOT = resolve(__dirname, "../..");

describe("S1 — Spec Graph", () => {
  it("builds a graph from specs with relations", () => {
    const specs = [
      fakeSpec({ id: "FEAT-AUTH", type: "feature", title: "Auth", version: "1.0.0" }),
      fakeSpec({
        id: "REQ-AUTH-001",
        type: "requirement",
        title: "Login",
        version: "1.0.0",
        priority: "must",
        acceptance_criteria: [{ id: "AC-AUTH-001-01", given: "g", when: "w", then: "t" }],
        relations: { refines: ["FEAT-AUTH"] },
      }),
    ];

    const { graph, errors } = buildSpecGraph(specs);
    expect(errors).toHaveLength(0);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toEqual({
      from: "REQ-AUTH-001",
      to: "FEAT-AUTH",
      relation: "refines",
    });
    expect(graph.topologicalOrder).toContain("FEAT-AUTH");
    expect(graph.topologicalOrder).toContain("REQ-AUTH-001");
  });

  it("detects orphan references", () => {
    const specs = [
      fakeSpec({
        id: "REQ-X-001",
        type: "requirement",
        title: "X",
        version: "1.0.0",
        priority: "must",
        acceptance_criteria: [{ id: "AC-X-001", given: "g", when: "w", then: "t" }],
        relations: { refines: ["FEAT-GHOST"] },
      }),
    ];

    const { errors } = buildSpecGraph(specs);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("FEAT-GHOST");
  });

  it("detects cycles", () => {
    const specs = [
      fakeSpec({
        id: "FEAT-A",
        type: "feature",
        title: "A",
        version: "1.0.0",
        relations: { depends_on: ["FEAT-B"] },
      }),
      fakeSpec({
        id: "FEAT-B",
        type: "feature",
        title: "B",
        version: "1.0.0",
        relations: { depends_on: ["FEAT-A"] },
      }),
    ];

    const { errors } = buildSpecGraph(specs);
    expect(errors.some((e) => e.includes("Cycle"))).toBe(true);
  });

  it("passes on the real sample specs", () => {
    const specs = loadAllSpecs(resolve(ROOT, "specs"), ROOT);
    const { graph, errors } = buildSpecGraph(specs);

    expect(errors).toHaveLength(0);
    expect(graph.nodes.length).toBeGreaterThanOrEqual(4);
  });
});
