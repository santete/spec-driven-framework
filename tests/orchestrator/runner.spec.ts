import { resolve } from "node:path";
import { rmSync, existsSync } from "node:fs";
import { describe, it, expect, afterEach } from "vitest";
import { runTick, runUntilHalt } from "../../src/keystone/orchestrator/runner.js";
import { createRun } from "../../src/keystone/orchestrator/machine.js";
import { makeRepoFixture, tearDownFixture } from "../helpers/repoFixture.js";

const ROOT = process.cwd();

describe("orchestrator runner", () => {
  it("runTick on S0 executes intake-qc against real specs and advances", () => {
    const fixture = makeRepoFixture();
    try {
      const r = createRun({ input: { title: "smoke" } });
      const after = runTick(r, { repoRoot: fixture });
      expect(after.history).toHaveLength(1);
      expect(after.history[0].station).toBe("S0");
      expect(after.history[0].verdict).toBe("pass");
      expect(after.current_station).toBe("S1");
      expect(after.last_report_path).toBe(".keystone/intake-report.json");
    } finally {
      tearDownFixture(fixture);
    }
  });

  it("runUntilHalt walks S0 → done in fixture (all stations pass)", () => {
    // Use fixture to avoid polluting real repo with S8 commits
    const fixture = makeRepoFixture();
    try {
      const r = createRun({ input: { title: "full" } });
      const finalState = runUntilHalt(r, { repoRoot: fixture });
      expect(finalState.status).toBe("done");
      // All 9 stations should have run
      expect(finalState.history.length).toBeGreaterThanOrEqual(9);
      expect(finalState.history[0].station).toBe("S0");
      expect(finalState.history[0].verdict).toBe("pass");
      // S1-S6 pass, S7 pass (vitest skipped in fixture), S8 pass (no git = skip commit)
      for (const s of ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]) {
        const h = finalState.history.find((x) => x.station === s && x.verdict === "pass");
        expect(h, `${s} should pass`).toBeDefined();
      }
    } finally {
      tearDownFixture(fixture);
    }
  });

  it("runTick no-ops on terminal state", () => {
    const fixture = makeRepoFixture();
    try {
      let r = createRun({ input: { title: "x" } });
      r = runUntilHalt(r, { repoRoot: fixture });
      expect(r.status).toBe("done");
      const same = runTick(r, { repoRoot: fixture });
      expect(same).toBe(r);
    } finally {
      tearDownFixture(fixture);
    }
  });
});
