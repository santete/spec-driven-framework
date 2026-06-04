import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runSessionStart } from "../session-start.js";

describe("SessionStart hook (HR1 fixture pattern)", () => {
  it("reports OK when all required files exist (current repo)", () => {
    const r = runSessionStart(process.cwd());
    expect(r.exitCode).toBe(0);
    expect(r.missing).toEqual([]);
    expect(r.stdout).toContain("scaffolding: OK");
  });

  it("reports missing files when run against an empty dir", () => {
    const tmp = mkdtempSync(join(tmpdir(), "keystone-session-"));
    try {
      const r = runSessionStart(tmp);
      expect(r.exitCode).toBe(0);
      expect(r.missing.length).toBeGreaterThan(0);
      expect(r.missing).toContain("CLAUDE.md");
      expect(r.missing).toContain("specs/spec-schema.json");
      expect(r.stdout).toContain("MISSING");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("partially-set-up dir reports only the missing ones", () => {
    const tmp = mkdtempSync(join(tmpdir(), "keystone-session-"));
    try {
      writeFileSync(join(tmp, "CLAUDE.md"), "# x");
      mkdirSync(join(tmp, "specs"));
      writeFileSync(join(tmp, "specs", "spec-schema.json"), "{}");
      const r = runSessionStart(tmp);
      expect(r.missing).not.toContain("CLAUDE.md");
      expect(r.missing).not.toContain("specs/spec-schema.json");
      expect(r.missing).toContain("specs/project.md");
      expect(r.missing).toContain(".trace/ownership.yaml");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
