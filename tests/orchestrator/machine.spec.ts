import { describe, it, expect } from "vitest";
import {
  createRun,
  recordOutcome,
  nextStation,
  isTerminal,
  resume,
  abort,
  generateRunId,
  generateSpecChangeId,
} from "../../src/keystone/orchestrator/machine.js";
import type { RunState } from "../../src/keystone/orchestrator/types.js";

const FIXED = new Date("2026-06-04T10:00:00Z");

function fresh(overrides: Partial<Parameters<typeof createRun>[0]> = {}): RunState {
  return createRun({
    input: { title: "test" },
    now: FIXED,
    ...overrides,
  });
}

describe("ID generators", () => {
  it("generateRunId is deterministic for fixed time", () => {
    expect(generateRunId(FIXED)).toBe("run-2026-06-04-100000");
  });
  it("generateSpecChangeId pads seq", () => {
    expect(generateSpecChangeId(FIXED, 7)).toBe("SC-2026-06-04-007");
  });
});

describe("createRun", () => {
  it("starts at S0 in_progress with empty history", () => {
    const r = fresh();
    expect(r.current_station).toBe("S0");
    expect(r.status).toBe("in_progress");
    expect(r.history).toEqual([]);
    expect(r.rework_global.k_global).toBe(5);
    expect(r.rework.S0?.k_self).toBe(5);
  });

  it("honors rework config overrides", () => {
    const r = fresh({
      rework: { k_global: 3, k_self: { S5: 1, S6: 7 } },
    });
    expect(r.rework_global.k_global).toBe(3);
    expect(r.rework.S5?.k_self).toBe(1);
    expect(r.rework.S6?.k_self).toBe(7);
    expect(r.rework.S0?.k_self).toBe(5); // default still applies
  });
});

describe("nextStation / isTerminal", () => {
  it("walks S0 → S8 → null", () => {
    expect(nextStation("S0")).toBe("S1");
    expect(nextStation("S7")).toBe("S8");
    expect(nextStation("S8")).toBeNull();
  });
  it("isTerminal recognizes done/aborted/failed", () => {
    expect(isTerminal("done")).toBe(true);
    expect(isTerminal("aborted")).toBe(true);
    expect(isTerminal("failed")).toBe(true);
    expect(isTerminal("in_progress")).toBe(false);
    expect(isTerminal("blocked")).toBe(false);
  });
});

describe("recordOutcome", () => {
  it("pass advances to next station", () => {
    const r = fresh();
    const next = recordOutcome(r, {
      started_at: "t1",
      ended_at: "t2",
      verdict: "pass",
      message: "ok",
    });
    expect(next.current_station).toBe("S1");
    expect(next.status).toBe("in_progress");
    expect(next.history).toHaveLength(1);
    expect(next.history[0].station).toBe("S0");
  });

  it("pass at S8 → done", () => {
    let r = fresh();
    for (const st of ["S0", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"] as const) {
      expect(r.current_station).toBe(st);
      r = recordOutcome(r, { started_at: "t", ended_at: "t", verdict: "pass" });
    }
    expect(r.status).toBe("done");
    expect(r.history).toHaveLength(9);
  });

  it("blocked stops machine and sets reason", () => {
    const r = fresh();
    const next = recordOutcome(r, {
      started_at: "t",
      ended_at: "t",
      verdict: "blocked",
      message: "waiting for human",
    });
    expect(next.status).toBe("blocked");
    expect(next.current_station).toBe("S0"); // unchanged
    expect(next.blocked_reason).toBe("waiting for human");
  });

  it("reject bumps rework but stays in_progress under budget", () => {
    const r = fresh();
    const next = recordOutcome(r, {
      started_at: "t",
      ended_at: "t",
      verdict: "reject",
    });
    expect(next.status).toBe("in_progress");
    expect(next.current_station).toBe("S0");
    expect(next.rework.S0?.count).toBe(1);
    expect(next.rework_global.count).toBe(1);
  });

  it("reject → failed when k_self budget exceeded", () => {
    let r = fresh({ rework: { k_self: { S0: 1 } } });
    r = recordOutcome(r, { started_at: "t", ended_at: "t", verdict: "reject" });
    expect(r.status).toBe("in_progress");
    r = recordOutcome(r, { started_at: "t", ended_at: "t", verdict: "reject" });
    expect(r.status).toBe("failed");
    expect(r.blocked_reason).toMatch(/Rework budget/);
  });

  it("reject → failed when k_global budget exceeded", () => {
    let r = fresh({ rework: { k_global: 1 } });
    r = recordOutcome(r, { started_at: "t", ended_at: "t", verdict: "reject" });
    r = recordOutcome(r, { started_at: "t", ended_at: "t", verdict: "reject" });
    expect(r.status).toBe("failed");
  });

  it("ignores writes after terminal state", () => {
    let r = fresh();
    r = abort(r);
    const after = recordOutcome(r, { started_at: "t", ended_at: "t", verdict: "pass" });
    expect(after).toBe(r);
  });

  it("threads report_path onto state", () => {
    const r = fresh();
    const next = recordOutcome(r, {
      started_at: "t",
      ended_at: "t",
      verdict: "pass",
      report_path: ".keystone/intake-report.json",
    });
    expect(next.last_report_path).toBe(".keystone/intake-report.json");
  });
});

describe("resume / abort", () => {
  it("resume flips blocked → in_progress and clears reason", () => {
    let r = fresh();
    r = recordOutcome(r, {
      started_at: "t",
      ended_at: "t",
      verdict: "blocked",
      message: "halt",
    });
    expect(r.status).toBe("blocked");
    const after = resume(r);
    expect(after.status).toBe("in_progress");
    expect(after.blocked_reason).toBeUndefined();
    expect(after.current_station).toBe("S0");
  });

  it("resume is a no-op on non-blocked", () => {
    const r = fresh();
    expect(resume(r)).toBe(r);
  });

  it("abort transitions to aborted and stops mutation", () => {
    const r = fresh();
    const a = abort(r);
    expect(a.status).toBe("aborted");
    expect(abort(a)).toBe(a);
  });
});
