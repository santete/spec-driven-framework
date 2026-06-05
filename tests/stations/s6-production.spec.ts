import { resolve } from "node:path";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { describe, it, expect, afterEach } from "vitest";
import { s6Handler } from "../../src/keystone/stations/s6-production.js";
import type { StationContext } from "../../src/keystone/orchestrator/stations.js";
import type { ImpactReport, TraceIndex } from "../../src/keystone/stations/types.js";

const ROOT = resolve(__dirname, "../..");

describe("S6 — Production", () => {
  const cleanupPaths: string[] = [];

  afterEach(() => {
    for (const p of cleanupPaths) {
      if (existsSync(p)) rmSync(p, { recursive: true, force: true });
    }
    cleanupPaths.length = 0;
  });

  it("generates code and tests from sample specs", () => {
    // Setup: write impact report + trace index
    const keystoneDir = resolve(ROOT, ".keystone");
    mkdirSync(keystoneDir, { recursive: true });

    const impact: ImpactReport = {
      run_id: "run-test",
      classification: "additive",
      changes: [
        { id: "ENT-USER", op: "added", spec_path: "specs/auth/ENT-USER.md", hash: "a" },
        { id: "REQ-AUTH-001", op: "added", spec_path: "specs/auth/REQ-AUTH-001.md", hash: "b" },
      ],
      affected_ids: ["ENT-USER", "REQ-AUTH-001"],
      required_actions: [
        { id: "ENT-USER", action: "generate" },
        { id: "REQ-AUTH-001", action: "generate" },
      ],
    };
    writeFileSync(resolve(keystoneDir, "impact-report.json"), JSON.stringify(impact));

    // Write a trace index so S6 can update it
    const traceDir = resolve(ROOT, ".trace");
    mkdirSync(traceDir, { recursive: true });
    const traceIndex: TraceIndex = {
      version: 1,
      entries: [
        { spec_id: "ENT-USER", spec_path: "specs/auth/ENT-USER.md", spec_version: "2.0.0", spec_content_hash: "x", implementations: [], tests: [], last_run_id: "init" },
        { spec_id: "REQ-AUTH-001", spec_path: "specs/auth/REQ-AUTH-001.md", spec_version: "1.2.0", spec_content_hash: "y", implementations: [], tests: [], last_run_id: "init" },
      ],
    };
    writeFileSync(resolve(traceDir, "index.json"), JSON.stringify(traceIndex));

    const ctx: StationContext = { repoRoot: ROOT, runId: "run-test", specChangeId: "SC-test" };
    const result = s6Handler(ctx);

    // Track generated dirs for cleanup
    cleanupPaths.push(resolve(ROOT, "src/generated"));
    cleanupPaths.push(resolve(ROOT, "tests/generated"));

    expect(result.verdict).toBe("pass");
    expect(result.message).toContain("generated");

    // Check files exist
    expect(existsSync(resolve(ROOT, "src/generated/auth/entities/ent_user.schema.ts"))).toBe(true);
    expect(existsSync(resolve(ROOT, "src/generated/auth/entities/ent_user.validator.ts"))).toBe(true);
    expect(existsSync(resolve(ROOT, "src/generated/auth/services/auth.service.ts"))).toBe(true);
    expect(existsSync(resolve(ROOT, "tests/generated/auth/auth.spec.ts"))).toBe(true);

    // Check provenance headers
    const service = readFileSync(resolve(ROOT, "src/generated/auth/services/auth.service.ts"), "utf8");
    expect(service).toContain("@keystone-owner    REQ-AUTH-001");
    expect(service).toContain("@run-id            run-test");

    // Check ownership updated
    const ownership = readFileSync(resolve(ROOT, ".trace/ownership.yaml"), "utf8");
    expect(ownership).toContain("ENT-USER");
    expect(ownership).toContain("REQ-AUTH-001");

    // Check trace index updated
    const updatedIndex: TraceIndex = JSON.parse(readFileSync(resolve(traceDir, "index.json"), "utf8"));
    const entEntry = updatedIndex.entries.find((e) => e.spec_id === "ENT-USER")!;
    expect(entEntry.implementations.length).toBeGreaterThan(0);

    // Cleanup reports
    for (const f of ["impact-report.json", "production-report.json"]) {
      const p = resolve(keystoneDir, f);
      if (existsSync(p)) rmSync(p);
    }
    // Restore ownership to empty
    writeFileSync(resolve(traceDir, "ownership.yaml"), "version: 1\nownership: {}\n");
    // Restore index to empty
    rmSync(resolve(traceDir, "index.json"));
  });
});
