import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { loadAllSpecs } from "../../src/keystone/spec/loader.js";
import { loadSchemaValidator } from "../../src/keystone/spec/validator.js";
import { runIntakeQc } from "../../src/keystone/intake/runner.js";

const ROOT = process.cwd();

describe("S0 intake runner on real sample specs", () => {
  it("passes G0 on the M1 sample set", () => {
    const specs = loadAllSpecs(resolve(ROOT, "specs"), ROOT);
    const validate = loadSchemaValidator(ROOT);
    const report = runIntakeQc(specs, validate, "test-run-001");

    if (report.verdict !== "pass") {
      const summary = report.items
        .map((i) => `  ${i.criterion}  ${i.spec_path}  ${i.field}  — ${i.message}`)
        .join("\n");
      throw new Error(`Expected pass but got reject:\n${summary}`);
    }
    expect(report.verdict).toBe("pass");
    expect(report.run_id).toBe("test-run-001");
    expect(report.items.filter((i) => i.severity === "blocker")).toHaveLength(0);
  });
});
