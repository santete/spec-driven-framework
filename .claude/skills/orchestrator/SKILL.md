---
name: orchestrator
description: |
  /spec-change pipeline orchestrator. Drives a spec change through 9
  stations S0–S8 with persistent run state + rework budgets (PRD §7.3).
  In Phase 0 M3, only S0 runs real logic; S1–S8 are stubs that auto-skip
  until M4 wires in semantic-diff, sdd-designer, codegen, etc.
---

# Skill: orchestrator (Phase 0 M3)

Single source of state for `/spec-change`. Owns `.keystone/run-state.json`
and the state-machine transitions S0 → … → S8 → done.

## Entry points

| Slash command          | CLI script                          | Purpose                            |
| ---------------------- | ----------------------------------- | ---------------------------------- |
| `/spec-change`         | `src/keystone/cli/spec-change.ts`   | Start a new run, walk to halt      |
| `/keystone:status`     | `src/keystone/cli/status.ts`        | Render current run state           |
| `/keystone:resume`     | `src/keystone/cli/resume.ts`        | Re-enter a blocked run             |
| `/keystone:abort`      | `src/keystone/cli/abort.ts`         | Terminate / purge                  |
| `/keystone:S0`         | `src/keystone/cli/s0.ts`            | Run S0 standalone (no run-state)   |

## State shape

`.keystone/run-state.json` — see `src/keystone/orchestrator/types.ts#RunState`.

- `current_station`: next station to execute.
- `status`: `in_progress` | `blocked` | `done` | `aborted` | `failed`.
- `history`: append-only audit log per station (verdict + message).
- `rework[StationId].{count,k_self}` + `rework_global.{count,k_global}`.

## Transitions (machine.ts)

| From verdict | Effect                                                                      |
| ------------ | --------------------------------------------------------------------------- |
| `pass`       | Advance to `nextStation` (or `done` if S8).                                 |
| `skipped`    | Same as pass — used by M3 stubs for S1–S8.                                  |
| `blocked`    | Status → `blocked`, station unchanged; `blocked_reason` stored.             |
| `reject`     | Bump `rework[station].count` + `rework_global.count`. If either > budget → `failed`; else stay. |

`resume()` flips `blocked → in_progress`. `abort()` flips to `aborted`.
Both are no-ops once terminal.

## Phase 0 M3 scope

| Item                                           | Status |
| ---------------------------------------------- | ------ |
| State machine (pure transitions)               | ✅      |
| `.keystone/run-state.json` persistence (atomic) | ✅      |
| `/spec-change` CLI                              | ✅      |
| `/keystone:status` CLI                          | ✅      |
| `/keystone:resume` / `/keystone:abort` CLIs     | ✅      |
| S0 wired to real intake-qc                      | ✅      |
| S1–S8 real impl (semantic-diff, …)              | ⏸ M4   |
| Gate G_SDD customer touchpoint                  | ⏸ M4   |
| `breaking` reviewer approval (G9)               | ⏸ M4   |

## Hooks interaction

PreToolUse hook (`.claude/hooks/pre-tool-use.ts`) blocks manual edits to
`.keystone/run-state.json`. All mutations must go through these CLIs.
