import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadRunState,
  saveRunState,
  clearRunState,
  runStatePath,
} from "../../src/keystone/orchestrator/store.js";
import { createRun } from "../../src/keystone/orchestrator/machine.js";

describe("run-state store", () => {
  it("returns null when no file exists", () => {
    const tmp = mkdtempSync(join(tmpdir(), "keystone-store-"));
    try {
      expect(loadRunState(tmp)).toBeNull();
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("save then load roundtrip preserves state", () => {
    const tmp = mkdtempSync(join(tmpdir(), "keystone-store-"));
    try {
      const r = createRun({ input: { title: "x" } });
      saveRunState(tmp, r);
      const loaded = loadRunState(tmp);
      expect(loaded).toEqual(r);
      expect(existsSync(runStatePath(tmp))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("clearRunState deletes file and returns true; idempotent", () => {
    const tmp = mkdtempSync(join(tmpdir(), "keystone-store-"));
    try {
      const r = createRun({ input: { title: "x" } });
      saveRunState(tmp, r);
      expect(clearRunState(tmp)).toBe(true);
      expect(loadRunState(tmp)).toBeNull();
      expect(clearRunState(tmp)).toBe(false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("save creates .keystone directory if missing", () => {
    const tmp = mkdtempSync(join(tmpdir(), "keystone-store-"));
    try {
      const r = createRun({ input: { title: "x" } });
      saveRunState(tmp, r);
      expect(existsSync(join(tmp, ".keystone"))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
