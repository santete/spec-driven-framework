import { describe, it, expect } from "vitest";
import { runTick, runUntilHalt } from "../../src/keystone/orchestrator/runner.js";
import { createRun } from "../../src/keystone/orchestrator/machine.js";

const ROOT = process.cwd();

describe("orchestrator runner", () => {
  it("runTick on S0 executes intake-qc against real specs and advances", () => {
    const r = createRun({ input: { title: "smoke" } });
    const after = runTick(r, { repoRoot: ROOT });
    expect(after.history).toHaveLength(1);
    expect(after.history[0].station).toBe("S0");
    expect(after.history[0].verdict).toBe("pass");
    expect(after.current_station).toBe("S1");
    expect(after.last_report_path).toBe(".keystone/intake-report.json");
  });

  it("runUntilHalt walks S0 → done over real specs (stubs skipped)", () => {
    const r = createRun({ input: { title: "full" } });
    const finalState = runUntilHalt(r, { repoRoot: ROOT });
    expect(finalState.status).toBe("done");
    expect(finalState.history).toHaveLength(9);
    expect(finalState.history[0].station).toBe("S0");
    expect(finalState.history[0].verdict).toBe("pass");
    for (const s of ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]) {
      const h = finalState.history.find((x) => x.station === s);
      expect(h?.verdict).toBe("skipped");
    }
  });

  it("runTick no-ops on terminal state", () => {
    let r = createRun({ input: { title: "x" } });
    r = runUntilHalt(r, { repoRoot: ROOT });
    expect(r.status).toBe("done");
    const same = runTick(r, { repoRoot: ROOT });
    expect(same).toBe(r);
  });
});
