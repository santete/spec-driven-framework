import { resolve } from "node:path";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { describe, it, expect, afterEach } from "vitest";
import { s5Handler } from "../../src/keystone/stations/s5-sdd-design.js";
import type { StationContext } from "../../src/keystone/orchestrator/stations.js";
import type { ImpactReport } from "../../src/keystone/stations/types.js";

const ROOT = resolve(__dirname, "../..");

describe("S5 — SDD Design", () => {
  const cleanupPaths: string[] = [];

  afterEach(() => {
    for (const p of cleanupPaths) {
      if (existsSync(p)) rmSync(p, { recursive: true, force: true });
    }
    cleanupPaths.length = 0;
  });

  it("generates SDDs for affected specs", () => {
    // Write a mock impact report
    const impact: ImpactReport = {
      run_id: "run-test",
      classification: "additive",
      changes: [
        { id: "FEAT-AUTH", op: "added", spec_path: "specs/auth/FEAT-AUTH.md", hash: "abc" },
        { id: "REQ-AUTH-001", op: "added", spec_path: "specs/auth/REQ-AUTH-001.md", hash: "def" },
        { id: "ENT-USER", op: "added", spec_path: "specs/auth/ENT-USER.md", hash: "ghi" },
      ],
      affected_ids: ["FEAT-AUTH", "REQ-AUTH-001", "ENT-USER"],
      required_actions: [
        { id: "FEAT-AUTH", action: "generate" },
        { id: "REQ-AUTH-001", action: "generate" },
        { id: "ENT-USER", action: "generate" },
      ],
    };

    const keystoneDir = resolve(ROOT, ".keystone");
    mkdirSync(keystoneDir, { recursive: true });
    writeFileSync(
      resolve(keystoneDir, "impact-report.json"),
      JSON.stringify(impact, null, 2),
    );

    const ctx: StationContext = {
      repoRoot: ROOT,
      runId: "run-test",
      specChangeId: "SC-test",
    };

    const result = s5Handler(ctx);
    expect(result.verdict).toBe("pass");
    expect(result.message).toContain("SDD");

    // Check SDD files were created
    const sddDir = resolve(ROOT, "specs", "sdd");
    cleanupPaths.push(sddDir);
    expect(existsSync(resolve(sddDir, "SDD-COMP-FEAT-AUTH.md"))).toBe(true);
    expect(existsSync(resolve(sddDir, "SDD-DATA-ENT-USER.md"))).toBe(true);

    // Cleanup reports
    for (const f of ["impact-report.json", "sdd-report.json"]) {
      const p = resolve(keystoneDir, f);
      if (existsSync(p)) rmSync(p);
    }
  });
});
