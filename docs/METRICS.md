# Framework Metrics — Design

> **TL;DR**: append-only event log tại `.claude/metrics/events.jsonl` (gitignored). Hooks ghi event tự động (fail-open). `/metrics` slash command in summary 7d/30d. Local-only mặc định, team aggregate là opt-in.
>
> **Token tracking**: full breakdown — input, cache_read, cache_creation, output — tracked per-session. Cache efficiency metric giúp đo hiệu quả prompt caching. Cost estimation per session.

## Why

Build framework rồi mà không có số liệu thì không biết:
- Framework có giảm hallucination thực tế không?
- Rule có catch vi phạm hay chỉ tạo friction?
- Pipeline có waste context không?
- Prompt caching có hiệu quả không?
- Session tốn bao nhiêu tiền?
- Chỗ nào cần cải thiện ưu tiên?

→ Cần observability layer **lightweight** (không gửi remote mặc định, không ảnh hưởng workflow).

## 9 metrics

| # | Metric | Source | "Tốt" | "Cần xem lại" |
|---|---|---|---|---|
| 1 | Sessions + token efficiency (avg final, % rotate) | `session_end` events | avg < 90k, rotate < 20% | rotate > 40% |
| 2 | HRS distribution (% GREEN/YELLOW/ORANGE/RED 7d) | `halluc_score` events | RED < 5%, GREEN > 70% | RED > 10% |
| 3 | Hook block rate (BLOCKER/session) | `hook_block` events | 0.5–2/session | 0 or > 5 |
| 4 | Phase 3 loop count (avg retries/verify) | `verify_done` + `loop_retry` events | < 1.5 | > 2.5 |
| 5 | Classify frequency (lần/tháng) | `classify` events | match LOC growth | spike đột ngột |
| 6 | Schema staleness (days) | live mtime check | < 14d | > 30d |
| 7 | Cache efficiency + output tokens | `session_end` events | cache hit ≥ 50% | cache hit < 20% |
| 8 | Estimated cost (USD) | `session_end` events | depends on model | track trend |

## Event schema

Mỗi event = 1 dòng JSON trong `.claude/metrics/events.jsonl`:

```json
{
  "ts": 1746489600,
  "event": "session_end|halluc_score|hook_block|rotate|classify|task_done|loop_retry|verify_done|drift_nudge",
  "pattern": "A" | "B" | "C" | "?",
  "data": { ... }
}
```

Event-specific `data`:

| Event | data fields |
|---|---|
| `session_end` | `final_tokens`, `input_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`, `output_tokens`, `cache_hit_pct`, `estimated_cost_usd`, `cost_model`, `rotated`, `session_id` |
| `halluc_score` | `hrs`, `color`, `dominant`, `schema_blocked`, `tokens`, `token_source`, `token_breakdown`, `cache_hit_pct`, `files_count` |
| `hook_block` | `hook` (post-write-check / block-dangerous), `rule`, `file` hoặc `command`, `severity` |
| `classify` | `pattern_recommended`, `loc`, `team_size`, `deployment_context`, `existing_state` |
| `rotate` | `tokens_at_rotate`, `session_summary_path` |
| `task_done` | `task`, `files_count`, `decisions_added`, `gotchas_added`, `drift_rebaselined` |
| `loop_retry` | `gate` (typecheck/lint/test/schema_check), `attempt`, `max_retry`, `resolved` |
| `verify_done` | `total_retries`, `gates_failed`, `escalated` |
| `drift_nudge` | `baseline`, `committed`, `uncommitted` |

## Collection mechanism

| Hook / Command | When | Source | Stack |
|---|---|---|---|
| `Stop` (settings.json) | Cuối mỗi session | `session-end.py` | Python |
| `PreToolUse: Bash` | Block dangerous command | `block-dangerous.py/sh/js` | All 3 |
| `PostToolUse: Edit\|Write` | Block code violation | `post-write-check.py/sh/js` | All 3 |
| `/halluc-score` | Every run (manual trigger) | `halluc-score.py` | Python |
| `/classify` | When user runs | Claude calls `metrics_writer.write_event()` | In-prompt |
| `/rotate` | When user rotates | Claude calls `metrics_writer.write_event()` | In-prompt |
| `/done` | Task completion | Claude calls `metrics_writer.write_event()` | In-prompt |
| `/verify` | Phase 3 loop | Claude calls `metrics_writer.write_event()` | In-prompt |

**Fail-open invariant**: `metrics_writer.write_event()` wrap toàn bộ trong try/except — exception không bao giờ raise. Một event mất = mất 1 dòng metric, KHÔNG block hook hoặc session.

**Auto-prune**: khi `events.jsonl` > 100 MB, `metrics_writer` tự giữ lại 90 ngày gần nhất, xóa cũ hơn. 100 MB ≈ ~500k events ≈ ~2.7 năm ở 50 events/day.

## Surface

### `/metrics` slash command

```bash
python .claude/hooks/python/metrics-summary.py --days 7
```

Output:
```
══════════════════════════════════════════════════════════════
  FRAMEWORK METRICS — last 7 days  [142 events, pattern B]
══════════════════════════════════════════════════════════════

  [1] Sessions:           18
      Avg final tokens:    47,200  🟢  (target < 90k)
      Rotate rate (≥120k):  11.1%  🟢  (target < 20%)

  [2] HRS distribution (12 runs):
      🟢 GREEN     8 ( 66.7%) █████████████
      🟡 YELLOW    3 ( 25.0%) █████
      🟠 ORANGE    1 (  8.3%) █
      🔴 RED       0 (  0.0%)

  [3] Hook blocks:
      Per session:         1.22   🟢  (target 0.5–2)
      post-write-check     18
      block-dangerous       4

  [4] Phase 3 loops:
      Verify runs:            8
      Avg retries/verify:   1.2   🟢  (target < 1.5)
      Total loop retries:    10
      By gate:
        typecheck              5
        lint                   3
        test                   2

  [5] Classify runs:      2

  [6] Schema staleness:   8d  🟢  (target < 14d)

  [7] Token breakdown (aggregate):
      Input (fresh):         62,000
      Cache read:           190,000
      Cache creation:        28,000
      Cache hit rate:        67.9%  🟢  (target ≥ 50%)
      Output tokens:         24,700
      Avg output/session:     8,233

  [8] Estimated cost (default model pricing):
      Total (7d):        $    1.2340
      Avg per session:   $    0.0686
```

### Statusline

Statusline displays (fast path < 50ms):
- Token count: `[A] 48k+24k/120k 🟢`
- Cache hit: `cache 67%`
- HRS badge: `HRS 0.28 🟢` (from pre-computed cache `.claude/cache/hrs_7d.json`, written by `/halluc-score`)
- Schema age: `schema 8d`

### HRS cache

`/halluc-score` writes `.claude/cache/hrs_7d.json` after each run:
```json
{"avg_hrs": 0.28, "dominant_color": "GREEN", "dominant_signal": "cite_coverage", "ts": 1746489600}
```
Statusline reads this file — no events.jsonl parsing needed.

## Token tracking — full breakdown

### 4 token types tracked

| Token type | Field name | Ý nghĩa | Cost implication |
|---|---|---|---|
| **Input** | `input_tokens` | Tokens gửi lên model (không cache) | Full input price |
| **Cache read** | `cache_read_input_tokens` | Tokens đọc từ prompt cache (reuse) | ~10% input price (rẻ nhất) |
| **Cache creation** | `cache_creation_input_tokens` | Tokens tạo cache entry mới | ~125% input price (đắt hơn input) |
| **Output** | `output_tokens` | Tokens model sinh ra | Output price (cao nhất) |

### Data flow

```
Claude Code API response (context_window.current_usage)
    │
    ├─► statusline.py
    │     ├─ Display: [A] 48k+24k/120k 🟢 · cache 67% · HRS 0.28 🟢
    │     └─ Persist: .claude/cache/last_tokens.json
    │           {tokens, baseline, working,
    │            input_tokens, cache_read_input_tokens,
    │            cache_creation_input_tokens, output_tokens, ts}
    │
    ├─► session-end.py (reads last_tokens.json at session close)
    │     ├─ Compute estimated_cost_usd from model_costs in thresholds.json
    │     └─ Write event: session_end → events.jsonl
    │           {final_tokens, input/cache_read/cache_create/output,
    │            cache_hit_pct, estimated_cost_usd, rotated, session_id}
    │
    ├─► halluc-score.py (reads last_tokens.json on /halluc-score)
    │     ├─ Uses tokens for context_drift signal
    │     ├─ Logs token_breakdown + cache_hit_pct in halluc_score event
    │     └─ Writes .claude/cache/hrs_7d.json for statusline badge
    │
    └─► metrics-summary.py (reads events.jsonl on /metrics)
          └─ Aggregates: per-type totals, cache hit%, output/session, cost/session
```

### Cache efficiency metric

```
cache_hit_pct = cache_read_input_tokens / (input + cache_read + cache_creation) × 100
```

| Range | Color | Interpretation |
|---|---|---|
| ≥ 50% | 🟢 | Prompt cache working well — most context reused |
| 20–50% | 🟡 | Moderate caching — review if CLAUDE.md structure helps caching |
| < 20% | 🔴 | Low/no caching — likely short sessions or high context churn |

## Cost estimation

### Model pricing config

`.claude/config/thresholds.json` includes `model_costs`:

```json
{
  "model_costs": {
    "default": {
      "input_per_1m": 15.00,
      "cache_read_per_1m": 1.50,
      "cache_create_per_1m": 18.75,
      "output_per_1m": 75.00
    },
    "opus": { ... },
    "sonnet": { ... },
    "haiku": { ... }
  }
}
```

Prices are per 1M tokens (USD). Update when model pricing changes. Set all to 0 to disable cost tracking.

### Calculation

```
estimated_cost = (input_tokens × input_per_1m / 1M)
               + (cache_read × cache_read_per_1m / 1M)
               + (cache_create × cache_create_per_1m / 1M)
               + (output_tokens × output_per_1m / 1M)
```

Currently uses `default` pricing for all sessions. Per-model detection is a future enhancement (requires model info in statusline cache).

## Auto-writeback system (M6-MR3)

### memory_writer.py

Schema-guarded write engine for `project_state.yaml`:

| Function | Purpose |
|---|---|
| `append_change(task, files)` | Add completed task to `completed_tasks[]` |
| `append_decision(decision, reason, impact)` | Add non-obvious decision (dedup by text) |
| `append_gotcha(discovery, workaround, files)` | Add gotcha (dedup by text) |
| `touch_last_updated()` | Bump `session_count` |
| `remove_pending(description)` | Remove completed pending task |

**Safety**: backup `.bak` → mutate in-memory → verify `old_ids ⊆ new_ids` → write → re-parse → rollback on failure.

### `/done` slash command

6-step task completion flow:
1. Gather git changes
2. Ask user for 1-line task summary → `append_change()`
3. Auto-detect decisions → `append_decision()`
4. Auto-detect gotchas → `append_gotcha()`
5. Re-baseline drift: `drift_check.py --baseline --source done`
6. Log `task_done` event + report to user

## Privacy + storage

- **Local-only mặc định**: `events.jsonl` ghi vào `.claude/metrics/`, gitignored.
- **PII risk**: events có `file_path` (post-write-check) và `command` (block-dangerous). Nếu sensitive → user redact trước khi share.
- **Storage**: ~50 events/day × 200 bytes = 10 KB/day = 3.6 MB/year. Auto-prune khi > 100 MB (giữ 90 ngày).
- **Cost data**: estimates only, not billing data. Based on configured pricing, not actual API costs.

## Team aggregation (opt-in)

Manual workflow nếu team muốn so sánh:
1. User chạy `python .claude/hooks/python/metrics-summary.py --json --days 30 > my-metrics.json`
2. Redact path/command nếu cần (`jq`)
3. Push lên shared dashboard (Grafana, custom internal)

Framework KHÔNG ship remote telemetry — compliance-safe (PCI/SOC2).

## Roadmap

- **P1 (done)**: events.jsonl + 4 events + `/metrics` summary + Stop hook + Python parity
- **P1.5 (done)**: token breakdown (input/cache_read/cache_creation/output), cache efficiency metric [7], statusline cache hit%, backward-compatible event schema
- **P2 (done)**: instrument `/classify` + `/rotate` events, statusline HRS-7d badge, auto-prune log (100MB → keep 90d)
- **P3 (done)**: Phase 3 loop count via `loop_retry` + `verify_done` events, metric [4] instrumented
- **P4 (done)**: Bash + Node parity for `metrics_writer` (all 3 stacks log events)
- **P5 (done)**: Cost estimation — `model_costs` in thresholds.json, `estimated_cost_usd` in session_end, metric [8]
- **M6-MR3 (done)**: Auto-writeback engine (`memory_writer.py`) + `/done` command + `task_done` events

## Liên quan

- `.claude/hooks/python/metrics_writer.py` — shared writer (Python, with auto-prune)
- `.claude/hooks/bash/metrics-writer.sh` — shared writer (Bash)
- `.claude/hooks/nodejs/metrics-writer.js` — shared writer (Node.js)
- `.claude/hooks/python/metrics-summary.py` — summarizer CLI (9 metrics)
- `.claude/hooks/python/session-end.py` — session close hook (token breakdown + cost)
- `.claude/hooks/python/halluc-score.py` — HRS scorer (token breakdown + HRS cache)
- `.claude/hooks/python/memory_writer.py` — schema-guarded write engine for project_state.yaml
- `.claude/statusline/statusline.py` — realtime display (cache hit%, HRS badge)
- `.claude/cache/last_tokens.json` — single source of truth for current session tokens
- `.claude/cache/hrs_7d.json` — pre-computed HRS for statusline badge
- `.claude/config/thresholds.json` — thresholds + model pricing config
- `.claude/commands/metrics.md` — /metrics slash command spec
- `.claude/commands/done.md` — /done slash command spec
- `.claude/commands/verify.md` — /verify slash command spec (loop instrumentation)
- `.claude/metrics/events.jsonl` — event log (gitignored)
