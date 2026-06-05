// @keystone-owner    REQ-HEALTH-001
// @spec-version      1.0.0
// @sdd-source        SDD-COMP-FEAT-HEALTH
// @generated-by      keystone@0.0.1
// @generated-at      2026-06-05T12:03:40Z
// @run-id            run-2026-06-05-120340

import { z } from "zod";

/**
 * Zod schema for the healthy (ok) response variant.
 * Maps to AC-HEALTH-001-01: { status: 'ok', uptime_ms: number, version: string }
 * @see specs/sdd/SDD-COMP-FEAT-HEALTH.md Section 3.1
 */
export const HealthOkSchema = z.object({
  status: z.literal("ok"),
  uptime_ms: z.number().int().nonnegative(),
  version: z.string(),
});

/**
 * Zod schema for the degraded response variant.
 * Maps to AC-HEALTH-001-02: { status: 'degraded', error: string }
 * @see specs/sdd/SDD-COMP-FEAT-HEALTH.md Section 3.1
 */
export const HealthDegradedSchema = z.object({
  status: z.literal("degraded"),
  error: z.string(),
});

/**
 * Discriminated union of ok and degraded health responses.
 * @see specs/sdd/SDD-COMP-FEAT-HEALTH.md Section 3.1
 */
export const HealthResponseSchema = z.discriminatedUnion("status", [
  HealthOkSchema,
  HealthDegradedSchema,
]);

/** Inferred TypeScript type for the ok health response. */
export type HealthOkResponse = z.infer<typeof HealthOkSchema>;

/** Inferred TypeScript type for the degraded health response. */
export type HealthDegradedResponse = z.infer<typeof HealthDegradedSchema>;

/** Inferred TypeScript type for the union health response. */
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
