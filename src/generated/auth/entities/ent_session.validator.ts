// @keystone-owner    ENT-SESSION
// @spec-version      1.0.0
// @sdd-source        SDD-DATA-ENT-SESSION
// @generated-by      keystone@0.0.1
// @generated-at      2026-06-05T09:28:29.189Z
// @run-id            run-2026-06-05-092829
import { z } from "zod";

export const SessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  token_hash: z.string(),
  expires_at: z.string().datetime().nullable(),
  revoked: z.string(),
});

export type Session = z.infer<typeof SessionSchema>;
