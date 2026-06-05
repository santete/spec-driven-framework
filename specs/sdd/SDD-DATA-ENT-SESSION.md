---
id: SDD-DATA-ENT-SESSION
type: sdd
title: Data design for ENT-SESSION
version: 1.0.0
status: approved
derived_from:
  spec_ids:
    - ENT-SESSION
components:
  - name: SessionTable
    module: src/generated/auth/entities/
    responsibilities:
      - "column: id (uuid)"
      - "column: user_id (uuid)"
      - "column: token_hash (string)"
      - "column: expires_at (timestamp)"
      - "column: revoked (boolean)"
risks:
  - Phase 0 template — schema mapping is placeholder
customer_approval:
  approved_by: phase0-auto
  approval_run_id: run-2026-06-05-092829
  approved_at: 2026-06-05T09:28:29.178Z
---

# SDD-DATA-ENT-SESSION

Auto-generated.
