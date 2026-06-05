import { resolve } from "node:path";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { describe, it, expect, afterEach } from "vitest";
import { runMd2SpecValidation } from "../../src/keystone/cli/md2spec.js";
import { makeRepoFixture, tearDownFixture } from "../helpers/repoFixture.js";

describe("md2spec validation", () => {
  let fixture: string;

  afterEach(() => {
    if (fixture) tearDownFixture(fixture);
  });

  it("detects draft specs and reports them", () => {
    fixture = makeRepoFixture();

    // Simulate: subagent has already created a draft spec
    const draftDir = resolve(fixture, "specs", "auth");
    mkdirSync(draftDir, { recursive: true });
    writeFileSync(resolve(draftDir, "REQ-AUTH-OTP.md"), `---
id: REQ-AUTH-OTP
type: requirement
title: "OTP login"
version: 1.0.0
status: draft
priority: should
relations:
  refines: [FEAT-AUTH]
  depends_on: [ENT-USER]
acceptance_criteria:
  - id: AC-AUTH-OTP-01
    given: "user nhập email"
    when: "gọi POST /auth/otp/request"
    then: "gửi OTP qua email"
---

# OTP Login
`);

    const result = runMd2SpecValidation({
      source: "specs/_drafts/otp-login.md",
      repoRoot: fixture,
    });

    expect(result.generatedSpecs).toBeDefined();
    expect(result.generatedSpecs!.length).toBeGreaterThanOrEqual(1);
    expect(result.generatedSpecs![0].id).toBe("REQ-AUTH-OTP");
    expect(result.generatedSpecs![0].status).toBe("draft");
    expect(result.stdout).toContain("REQ-AUTH-OTP");
  });

  it("reports no draft specs when none exist", () => {
    fixture = makeRepoFixture();
    const result = runMd2SpecValidation({
      source: "prose.md",
      repoRoot: fixture,
    });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("No draft specs");
  });

  it("detects intake blockers in draft specs", () => {
    fixture = makeRepoFixture();

    // Create a draft spec with missing required fields (will fail IQ1)
    const draftDir = resolve(fixture, "specs", "test");
    mkdirSync(draftDir, { recursive: true });
    writeFileSync(resolve(draftDir, "REQ-BAD.md"), `---
id: REQ-BAD
type: requirement
title: "Bad spec"
version: 1.0.0
status: draft
priority: must
---

# Missing acceptance criteria for priority=must
`);

    const result = runMd2SpecValidation({
      source: "test.md",
      repoRoot: fixture,
      json: true,
    });

    const parsed = JSON.parse(result.stdout);
    expect(parsed.intake_verdict).toBe("reject");
    expect(parsed.violations.length).toBeGreaterThan(0);
  });
});
