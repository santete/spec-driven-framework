import { describe, it, expect } from "vitest";
import { runS0Cli } from "../../src/keystone/cli/s0.js";

describe("S0 CLI (function-level)", () => {
  it("dry-run on sample specs exits 0 with pass verdict (JSON)", () => {
    const result = runS0Cli({ dryRun: true, json: true, repoRoot: process.cwd() });
    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.verdict).toBe("pass");
    expect(report.items).toEqual([]);
  });

  it("dry-run renders human-readable output", () => {
    const result = runS0Cli({ dryRun: true, json: false, repoRoot: process.cwd() });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("PASS");
    expect(result.stdout).toContain("run_id:");
  });
});
