import { describe, it, expect, afterEach } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runSpecChangeCli } from "../../src/keystone/cli/spec-change.js";
import { runStatusCli } from "../../src/keystone/cli/status.js";
import { runAbortCli } from "../../src/keystone/cli/abort.js";
import { runResumeCli } from "../../src/keystone/cli/resume.js";
import { makeRepoFixture, tearDownFixture } from "../helpers/repoFixture.js";

describe("CLI: /spec-change → status → resume → abort", () => {
  let fixture: string;

  afterEach(() => {
    if (fixture) tearDownFixture(fixture);
  });

  it("rejects when --title is missing", () => {
    fixture = makeRepoFixture();
    const r = runSpecChangeCli({
      title: "",
      touchedSpecs: [],
      json: false,
      dryRun: true,
      repoRoot: fixture,
    });
    expect(r.exitCode).toBe(2);
    expect(r.stdout).toContain("--title");
  });

  it("dry-run completes pipeline, never writes run-state", () => {
    fixture = makeRepoFixture();
    const r = runSpecChangeCli({
      title: "Add login flow",
      touchedSpecs: ["specs/auth/REQ-AUTH-001.md"],
      json: true,
      dryRun: true,
      repoRoot: fixture,
    });
    expect(r.exitCode).toBe(0);
    const state = JSON.parse(r.stdout);
    expect(state.status).toBe("done");
    expect(state.history).toHaveLength(9);
    expect(existsSync(join(fixture, ".keystone", "run-state.json"))).toBe(false);
  });

  it("non-dry-run writes run-state.json + intake-report.json", () => {
    fixture = makeRepoFixture();
    const r = runSpecChangeCli({
      title: "Add login flow",
      touchedSpecs: [],
      json: true,
      dryRun: false,
      repoRoot: fixture,
    });
    expect(r.exitCode).toBe(0);
    expect(existsSync(join(fixture, ".keystone", "run-state.json"))).toBe(true);
    expect(existsSync(join(fixture, ".keystone", "intake-report.json"))).toBe(true);

    const stateOnDisk = JSON.parse(
      readFileSync(join(fixture, ".keystone", "run-state.json"), "utf8"),
    );
    expect(stateOnDisk.status).toBe("done");
    expect(stateOnDisk.input.title).toBe("Add login flow");
  });

  it("refuses to start a 2nd run while one is in flight", () => {
    fixture = makeRepoFixture();
    runSpecChangeCli({
      title: "First",
      touchedSpecs: [],
      json: false,
      dryRun: false,
      repoRoot: fixture,
    });
    // After above, status=done — so a new run IS allowed. Force the saved
    // state into in_progress to simulate a half-completed run.
    const path = join(fixture, ".keystone", "run-state.json");
    const s = JSON.parse(readFileSync(path, "utf8"));
    s.status = "in_progress";
    s.current_station = "S3";
    writeFileSync(path, JSON.stringify(s));

    const second = runSpecChangeCli({
      title: "Second",
      touchedSpecs: [],
      json: false,
      dryRun: false,
      repoRoot: fixture,
    });
    expect(second.exitCode).toBe(2);
    expect(second.stdout).toContain("active run");
  });

  it("status reports 'no active run' when state file absent", () => {
    fixture = makeRepoFixture();
    const r = runStatusCli({ json: false, repoRoot: fixture });
    expect(r.exitCode).toBe(3);
    expect(r.stdout).toContain("no active run");
  });

  it("status renders pipeline after a completed run", () => {
    fixture = makeRepoFixture();
    runSpecChangeCli({
      title: "ok",
      touchedSpecs: [],
      json: false,
      dryRun: false,
      repoRoot: fixture,
    });
    const r = runStatusCli({ json: false, repoRoot: fixture });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("status      : done");
    expect(r.stdout).toContain("✓ S0");
    expect(r.stdout).toContain("· S5");
  });

  it("abort marks run as aborted (file preserved)", () => {
    fixture = makeRepoFixture();
    runSpecChangeCli({
      title: "x",
      touchedSpecs: [],
      json: false,
      dryRun: false,
      repoRoot: fixture,
    });
    const r = runAbortCli({ purge: false, json: false, repoRoot: fixture });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("aborted run");
    expect(existsSync(join(fixture, ".keystone", "run-state.json"))).toBe(true);
  });

  it("abort --purge removes the file", () => {
    fixture = makeRepoFixture();
    runSpecChangeCli({
      title: "x",
      touchedSpecs: [],
      json: false,
      dryRun: false,
      repoRoot: fixture,
    });
    const r = runAbortCli({ purge: true, json: false, repoRoot: fixture });
    expect(r.exitCode).toBe(0);
    expect(existsSync(join(fixture, ".keystone", "run-state.json"))).toBe(false);
  });

  it("abort returns exit 3 when no state file", () => {
    fixture = makeRepoFixture();
    const r = runAbortCli({ purge: false, json: false, repoRoot: fixture });
    expect(r.exitCode).toBe(3);
  });

  it("resume on terminal run reports cannot-resume", () => {
    fixture = makeRepoFixture();
    runSpecChangeCli({
      title: "x",
      touchedSpecs: [],
      json: false,
      dryRun: false,
      repoRoot: fixture,
    });
    const r = runResumeCli({ json: false, repoRoot: fixture });
    expect(r.exitCode).toBe(2);
    expect(r.stdout).toContain("terminal");
  });

  it("resume reports no active run when state file absent", () => {
    fixture = makeRepoFixture();
    const r = runResumeCli({ json: false, repoRoot: fixture });
    expect(r.exitCode).toBe(3);
  });
});
