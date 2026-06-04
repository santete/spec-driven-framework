import { describe, it, expect } from "vitest";
import { fakeSpec } from "../helpers/fakeSpec.js";
import { checkSR1 } from "../../src/keystone/lint/rules/sr1-unique-id.js";
import { checkSR3 } from "../../src/keystone/lint/rules/sr3-no-orphan-refs.js";
import { checkSR4 } from "../../src/keystone/lint/rules/sr4-schema-valid.js";
import { checkSR6 } from "../../src/keystone/lint/rules/sr6-must-has-ac.js";
import { loadSchemaValidator } from "../../src/keystone/spec/validator.js";

describe("SR1 — unique ID", () => {
  it("passes when all IDs unique", () => {
    const specs = [
      fakeSpec({ id: "REQ-A-001", type: "requirement", title: "A", version: "1.0.0", priority: "must", acceptance_criteria: [{ id: "AC-A-001", given: "g", when: "w", then: "t" }] }),
      fakeSpec({ id: "REQ-B-001", type: "requirement", title: "B", version: "1.0.0", priority: "must", acceptance_criteria: [{ id: "AC-B-001", given: "g", when: "w", then: "t" }] }),
    ];
    expect(checkSR1(specs)).toEqual([]);
  });

  it("flags duplicate IDs across files", () => {
    const specs = [
      fakeSpec({ id: "REQ-DUP-001", type: "requirement", title: "X", version: "1.0.0", priority: "must" }, "specs/x.md"),
      fakeSpec({ id: "REQ-DUP-001", type: "requirement", title: "Y", version: "1.0.0", priority: "must" }, "specs/y.md"),
    ];
    const v = checkSR1(specs);
    expect(v).toHaveLength(2);
    expect(v[0].criterion).toBe("SR1");
    expect(v[0].severity).toBe("blocker");
    expect(v[0].message).toContain("REQ-DUP-001");
  });
});

describe("SR3 — no orphan refs", () => {
  it("passes when all relations resolve", () => {
    const specs = [
      fakeSpec({ id: "FEAT-A", type: "feature", title: "A", version: "1.0.0" }),
      fakeSpec({
        id: "REQ-A-001",
        type: "requirement",
        title: "R",
        version: "1.0.0",
        priority: "must",
        acceptance_criteria: [{ id: "AC-A-001-01", given: "g", when: "w", then: "t" }],
        relations: { refines: ["FEAT-A"] },
      }),
    ];
    expect(checkSR3(specs)).toEqual([]);
  });

  it("flags orphan refines target", () => {
    const specs = [
      fakeSpec({
        id: "REQ-X-001",
        type: "requirement",
        title: "R",
        version: "1.0.0",
        priority: "must",
        relations: { refines: ["FEAT-NONEXISTENT"] },
      }),
    ];
    const v = checkSR3(specs);
    expect(v).toHaveLength(1);
    expect(v[0].criterion).toBe("SR3");
    expect(v[0].field).toBe("relations.refines");
    expect(v[0].message).toContain("FEAT-NONEXISTENT");
  });
});

describe("SR4 — schema valid", () => {
  const validate = loadSchemaValidator(process.cwd());

  it("passes for a well-formed REQ", () => {
    const specs = [
      fakeSpec({
        id: "REQ-A-001",
        type: "requirement",
        title: "Login",
        version: "1.0.0",
        priority: "must",
        acceptance_criteria: [{ id: "AC-A-001-01", given: "g", when: "w", then: "t" }],
      }),
    ];
    expect(checkSR4(specs, validate)).toEqual([]);
  });

  it("flags missing required priority on REQ", () => {
    const specs = [
      fakeSpec({
        id: "REQ-NOPRI",
        type: "requirement",
        title: "no priority",
        version: "1.0.0",
      }),
    ];
    const v = checkSR4(specs, validate);
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].criterion).toBe("SR4");
  });

  it("flags invalid ID grammar", () => {
    const specs = [
      fakeSpec({
        id: "lowercase-bad",
        type: "feature",
        title: "x",
        version: "1.0.0",
      }),
    ];
    const v = checkSR4(specs, validate);
    expect(v.some((x) => x.field.includes("/id"))).toBe(true);
  });
});

describe("SR6 — REQ must has AC", () => {
  it("passes when must REQ has AC", () => {
    const specs = [
      fakeSpec({
        id: "REQ-OK-001",
        type: "requirement",
        title: "ok",
        version: "1.0.0",
        priority: "must",
        acceptance_criteria: [{ id: "AC-OK-001", given: "g", when: "w", then: "t" }],
      }),
    ];
    expect(checkSR6(specs)).toEqual([]);
  });

  it("does not flag should/could REQ without AC", () => {
    const specs = [
      fakeSpec({ id: "REQ-SHOULD-001", type: "requirement", title: "s", version: "1.0.0", priority: "should" }),
      fakeSpec({ id: "REQ-COULD-001", type: "requirement", title: "c", version: "1.0.0", priority: "could" }),
    ];
    expect(checkSR6(specs)).toEqual([]);
  });

  it("flags must REQ with empty AC", () => {
    const specs = [
      fakeSpec({ id: "REQ-MISS-001", type: "requirement", title: "m", version: "1.0.0", priority: "must" }),
    ];
    const v = checkSR6(specs);
    expect(v).toHaveLength(1);
    expect(v[0].criterion).toBe("SR6");
    expect(v[0].field).toBe("acceptance_criteria");
  });
});
