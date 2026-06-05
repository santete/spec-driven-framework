// @keystone-owner    REQ-HEALTH-001
// @spec-version      1.0.0
// @sdd-source        SDD-COMP-FEAT-HEALTH
// @generated-by      keystone@0.0.1
// @generated-at      2026-06-05T12:03:40Z
// @run-id            run-2026-06-05-120340

import type { HealthResponse } from "../schemas/health.schema";
import { createRequire } from "node:module";

/**
 * Application version resolved once at module load time from the root
 * package.json. Falls back to "0.0.0" if package.json cannot be read.
 *
 * @see specs/sdd/SDD-COMP-FEAT-HEALTH.md Section 3.2 -- "read version from package.json"
 * @see specs/project.md -- package version field
 */
const APP_VERSION: string = (() => {
  try {
    const require = createRequire(import.meta.url);
    const pkg = require("../../../../package.json") as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
})();

/**
 * Performs a health check by invoking the injected database connectivity probe.
 *
 * Pure function with no direct I/O -- the `dbCheck` callback is injected by
 * the caller, keeping this service testable without a real database.
 * Version is resolved at module load time from package.json.
 *
 * @param dbCheck - Injected function that returns `true` if the database is
 *                  reachable, or `false` otherwise.
 * @returns A `HealthResponse` -- either the ok variant (AC-HEALTH-001-01)
 *          or the degraded variant (AC-HEALTH-001-02).
 *
 * @see specs/infra/REQ-HEALTH-001.md       -- acceptance criteria
 * @see specs/sdd/SDD-COMP-FEAT-HEALTH.md   -- component design Section 3.2
 */
export function getHealth(dbCheck: () => boolean): HealthResponse {
  const uptimeMs = Math.floor(process.uptime() * 1000);

  try {
    const isHealthy = dbCheck();

    if (isHealthy) {
      // AC-HEALTH-001-01: service running normally -> ok response
      return {
        status: "ok" as const,
        uptime_ms: uptimeMs,
        version: APP_VERSION,
      };
    }

    // dbCheck returned false -- treat as degraded
    return {
      status: "degraded" as const,
      error: "Database connectivity check failed",
    };
  } catch (err: unknown) {
    // AC-HEALTH-001-02: database unreachable -> degraded response
    const message =
      err instanceof Error ? err.message : "Unknown database error";
    return {
      status: "degraded" as const,
      error: message,
    };
  }
}
