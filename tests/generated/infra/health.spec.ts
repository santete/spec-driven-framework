// @keystone-owner    REQ-HEALTH-001
// @spec-version      1.0.0
// @sdd-source        SDD-COMP-INFRA-HEALTH
// @generated-by      keystone@0.0.1
// @generated-at      2026-06-05T12:03:40Z
// @run-id            run-2026-06-05-120340

import { describe, it, expect } from "vitest";
import { getHealth } from "../../../src/generated/infra/services/health.service.js";

describe("REQ-HEALTH-001 — Health Check Endpoint", () => {
  describe("AC-HEALTH-001-01: service running normally", () => {
    it("returns status 'ok' with uptime_ms and version when dbCheck succeeds (AC-HEALTH-001-01)", () => {
      // Given: service is running normally, DB is reachable
      const dbCheck = () => true;

      // When: getHealth is called
      const result = getHealth(dbCheck);

      // Then: returns { status: 'ok', uptime_ms: number, version: string }
      expect(result.status).toBe("ok");
      expect(result.uptime_ms).toBeTypeOf("number");
      expect(result.uptime_ms).toBeGreaterThan(0);
      expect(result.version).toBeDefined();
      expect(result.version).toBeTypeOf("string");
      expect(result.version.length).toBeGreaterThan(0);
    });
  });

  describe("AC-HEALTH-001-02: database unreachable", () => {
    it("returns status 'degraded' with error when dbCheck returns false (AC-HEALTH-001-02)", () => {
      // Given: database is not reachable
      const dbCheck = () => false;

      // When: getHealth is called
      const result = getHealth(dbCheck);

      // Then: returns { status: 'degraded', error: string }
      expect(result.status).toBe("degraded");
      expect(result.error).toBeDefined();
      expect(result.error).toBeTypeOf("string");
      expect(result.error!.length).toBeGreaterThan(0);
    });
  });

  describe("Edge case: dbCheck throws an exception", () => {
    it("handles dbCheck throwing gracefully and returns degraded status", () => {
      // Given: dbCheck throws an unexpected error
      const dbCheck = () => {
        throw new Error("Connection refused");
      };

      // When: getHealth is called
      const result = getHealth(dbCheck);

      // Then: should handle gracefully, returning degraded
      expect(result.status).toBe("degraded");
      expect(result.error).toBeDefined();
      expect(result.error).toBeTypeOf("string");
    });
  });
});
