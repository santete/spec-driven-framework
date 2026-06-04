import { describe, it, expect } from "vitest";
import { fakeSpec } from "../helpers/fakeSpec.js";
import { checkIQ1 } from "../../src/keystone/intake/checks/iq1-completeness.js";
import { checkIQ2 } from "../../src/keystone/intake/checks/iq2-clarity.js";
import { checkIQ3 } from "../../src/keystone/intake/checks/iq3-feasibility.js";
import { checkIQ4 } from "../../src/keystone/intake/checks/iq4-resolvability.js";
import { checkIQ6 } from "../../src/keystone/intake/checks/iq6-nfr-measurability.js";
import { checkIQ7 } from "../../src/keystone/intake/checks/iq7-project-compatibility.js";
import { checkIQ8 } from "../../src/keystone/intake/checks/iq8-project-artifact-present.js";

describe("IQ1 — completeness", () => {
  it("flags FEAT without any REQ refining it", () => {
    const specs = [fakeSpec({ id: "FEAT-LONELY", type: "feature", title: "x", version: "1.0.0" })];
    const v = checkIQ1(specs);
    expect(v.some((x) => x.id === "FEAT-LONELY" && x.criterion === "IQ1")).toBe(true);
  });

  it("passes when FEAT has REQ refines", () => {
    const specs = [
      fakeSpec({ id: "FEAT-OK", type: "feature", title: "ok", version: "1.0.0" }),
      fakeSpec({
        id: "REQ-OK-001",
        type: "requirement",
        title: "r",
        version: "1.0.0",
        priority: "must",
        acceptance_criteria: [{ id: "AC-OK-001", given: "g", when: "w", then: "t" }],
        relations: { refines: ["FEAT-OK"] },
      }),
    ];
    expect(checkIQ1(specs)).toEqual([]);
  });

  it("flags ENT without invariants", () => {
    const specs = [
      fakeSpec({
        id: "ENT-X",
        type: "entity",
        title: "x",
        version: "1.0.0",
        fields: [{ name: "id" }],
      }),
    ];
    const v = checkIQ1(specs);
    expect(v.some((x) => x.field === "invariants")).toBe(true);
  });
});

describe("IQ2 — clarity", () => {
  it("flags TBD/TODO/??? tokens in frontmatter", () => {
    const specs = [
      fakeSpec({
        id: "REQ-VAGUE-001",
        type: "requirement",
        title: "TODO finish later",
        version: "1.0.0",
        priority: "must",
      }),
    ];
    const v = checkIQ2(specs);
    expect(v.some((x) => x.message.includes("TODO"))).toBe(true);
  });

  it("flags AC with empty when", () => {
    const specs = [
      fakeSpec({
        id: "REQ-AC-001",
        type: "requirement",
        title: "x",
        version: "1.0.0",
        priority: "must",
        acceptance_criteria: [{ id: "AC-AC-001", given: "g", when: "", then: "t" }],
      }),
    ];
    const v = checkIQ2(specs);
    expect(v.some((x) => x.field.includes(".when"))).toBe(true);
  });
});

describe("IQ3 — feasibility (partial)", () => {
  it("flags unresolved depends_on", () => {
    const specs = [
      fakeSpec({
        id: "REQ-DEPS",
        type: "requirement",
        title: "d",
        version: "1.0.0",
        priority: "must",
        relations: { depends_on: ["ENT-GHOST"] },
      }),
    ];
    const v = checkIQ3(specs);
    expect(v).toHaveLength(1);
    expect(v[0].criterion).toBe("IQ3");
  });
});

describe("IQ4 — resolvability", () => {
  it("flags unresolved schema_ref", () => {
    const specs = [
      fakeSpec({
        id: "API-X",
        type: "api",
        title: "x",
        version: "1.0.0",
        openapi: {
          path: "/x",
          method: "POST",
          request_schema_ref: "SCHEMA-GHOST",
          response: { "200": { schema_ref: "SCHEMA-OK" } },
        },
      }),
      fakeSpec({
        id: "SCHEMA-OK",
        type: "schema",
        title: "ok",
        version: "1.0.0",
        json_schema: { type: "object" },
      }),
    ];
    const v = checkIQ4(specs);
    expect(v.some((x) => x.message.includes("SCHEMA-GHOST"))).toBe(true);
    expect(v.find((x) => x.message.includes("SCHEMA-OK"))).toBeUndefined();
  });
});

describe("IQ6 — NFR measurability", () => {
  it("flags NFR without budget", () => {
    const specs = [fakeSpec({ id: "NFR-X", type: "nfr", title: "x", version: "1.0.0" })];
    const v = checkIQ6(specs);
    expect(v.some((x) => x.field === "budget")).toBe(true);
  });

  it("flags non-numeric threshold", () => {
    const specs = [
      fakeSpec({
        id: "NFR-LAT",
        type: "nfr",
        title: "lat",
        version: "1.0.0",
        budget: { metric: "latency_p95_ms", threshold: "fast" as unknown as number, measured_by: "k6 1000 rps" },
      }),
    ];
    const v = checkIQ6(specs);
    expect(v.some((x) => x.field === "budget.threshold")).toBe(true);
  });

  it("warns on vague measured_by", () => {
    const specs = [
      fakeSpec({
        id: "NFR-WARN",
        type: "nfr",
        title: "w",
        version: "1.0.0",
        budget: { metric: "latency_p95_ms", threshold: 300, measured_by: "đo cho nó nhanh" },
      }),
    ];
    const v = checkIQ6(specs);
    expect(v.some((x) => x.severity === "warning")).toBe(true);
  });
});

describe("IQ7 — project compatibility", () => {
  it("flags invalid HTTP method in API", () => {
    const project = { id: "P", type: "project" as const, title: "p", version: "1.0.0", profile: "x", stack: { http: "fastify" } };
    const specs = [
      fakeSpec({
        id: "API-BAD",
        type: "api",
        title: "x",
        version: "1.0.0",
        openapi: { path: "/x", method: "TRACE-X" },
      }),
    ];
    const v = checkIQ7(specs, project);
    expect(v.some((x) => x.criterion === "IQ7")).toBe(true);
  });
});

describe("IQ8 — PROJECT artifact present", () => {
  it("flags missing PROJECT", () => {
    const specs = [fakeSpec({ id: "REQ-X-001", type: "requirement", title: "x", version: "1.0.0", priority: "must" })];
    const v = checkIQ8(specs);
    expect(v).toHaveLength(1);
    expect(v[0].message).toContain("PROJECT");
  });

  it("flags PROJECT with non-approved status", () => {
    const specs = [
      fakeSpec({
        id: "PROJECT-X",
        type: "project",
        title: "p",
        version: "1.0.0",
        status: "draft",
        profile: "x",
        stack: {},
      }),
    ];
    const v = checkIQ8(specs);
    expect(v.some((x) => x.field === "status")).toBe(true);
  });

  it("flags custom_repo profile_source in Phase 1", () => {
    const specs = [
      fakeSpec({
        id: "PROJECT-X",
        type: "project",
        title: "p",
        version: "1.0.0",
        status: "approved",
        profile: "x",
        profile_source: "custom_repo",
        stack: {},
      }),
    ];
    const v = checkIQ8(specs);
    expect(v.some((x) => x.field === "profile_source")).toBe(true);
  });
});
