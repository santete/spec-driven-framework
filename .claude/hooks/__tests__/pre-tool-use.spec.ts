import { describe, it, expect } from "vitest";
import {
  runPreToolUse,
  isProtected,
  normalizePath,
} from "../pre-tool-use.js";

describe("PreToolUse hook (HR1 fixture pattern)", () => {
  describe("normalizePath", () => {
    it("converts backslashes to forward slashes", () => {
      expect(normalizePath("src\\generated\\auth\\login.ts")).toBe("src/generated/auth/login.ts");
    });

    it("strips repo root prefix when given", () => {
      expect(
        normalizePath("C:/repo/src/generated/x.ts", "C:/repo"),
      ).toBe("src/generated/x.ts");
    });

    it("strips leading ./", () => {
      expect(normalizePath("./src/generated/x.ts")).toBe("src/generated/x.ts");
    });
  });

  describe("isProtected", () => {
    it("flags src/generated/", () => {
      expect(isProtected("src/generated/auth/login.ts")).toBe(true);
    });

    it("flags tests/generated/ and tests/adversarial/", () => {
      expect(isProtected("tests/generated/auth/login.spec.ts")).toBe(true);
      expect(isProtected("tests/adversarial/auth/login.adversarial.spec.ts")).toBe(true);
    });

    it("flags exact runtime state files", () => {
      expect(isProtected(".keystone/run-state.json")).toBe(true);
      expect(isProtected(".trace/index.json")).toBe(true);
    });

    it("does NOT flag ownership.yaml (user-editable input)", () => {
      expect(isProtected(".trace/ownership.yaml")).toBe(false);
    });

    it("does NOT flag spec files or src/lib/", () => {
      expect(isProtected("specs/auth/REQ-AUTH-001.md")).toBe(false);
      expect(isProtected("src/lib/util.ts")).toBe(false);
      expect(isProtected("tests/schema/validate-sample.spec.ts")).toBe(false);
    });
  });

  describe("runPreToolUse", () => {
    it("returns exit 0 for unrelated tools", () => {
      expect(runPreToolUse({ tool_name: "Read", tool_input: { file_path: "src/generated/x.ts" } })).toEqual({ exitCode: 0 });
      expect(runPreToolUse({ tool_name: "Bash", tool_input: {} })).toEqual({ exitCode: 0 });
    });

    it("returns exit 0 for Write to non-protected paths", () => {
      const r = runPreToolUse({ tool_name: "Write", tool_input: { file_path: "src/lib/util.ts" } });
      expect(r.exitCode).toBe(0);
    });

    it("returns exit 2 + stderr for Write to src/generated/", () => {
      const r = runPreToolUse({ tool_name: "Write", tool_input: { file_path: "src/generated/auth/login.ts" } });
      expect(r.exitCode).toBe(2);
      expect(r.stderr).toContain("[keystone] Blocked");
      expect(r.stderr).toContain("src/generated/auth/login.ts");
      expect(r.stderr).toContain("/spec-change");
    });

    it("returns exit 2 for Edit to runtime state file", () => {
      const r = runPreToolUse({
        tool_name: "Edit",
        tool_input: { file_path: ".keystone/intake-report.json" },
      });
      expect(r.exitCode).toBe(2);
    });

    it("returns exit 2 for MultiEdit to tests/generated/", () => {
      const r = runPreToolUse({
        tool_name: "MultiEdit",
        tool_input: { file_path: "tests/generated/auth/login.spec.ts" },
      });
      expect(r.exitCode).toBe(2);
    });

    it("handles missing tool_input gracefully", () => {
      expect(runPreToolUse({ tool_name: "Write" })).toEqual({ exitCode: 0 });
      expect(runPreToolUse({ tool_name: "Write", tool_input: {} })).toEqual({ exitCode: 0 });
    });

    it("respects repoRoot when normalizing absolute paths", () => {
      const r = runPreToolUse(
        { tool_name: "Write", tool_input: { file_path: "C:/repo/src/generated/x.ts" } },
        "C:/repo",
      );
      expect(r.exitCode).toBe(2);
    });
  });
});
