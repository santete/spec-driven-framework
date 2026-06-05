---
description: Show framework health metrics (last 7d) — 9 metrics including HRS, token efficiency, cache, cost
---

# /metrics — Framework health summary

Đọc `.claude/metrics/events.jsonl` → in 9 metric core. Local-only, không gửi remote.

## Cách Claude phải execute

Khi user gõ `/metrics`:

1. Run script:
   - Python: `python .claude/hooks/python/metrics-summary.py --days 7`

2. Show user output trực tiếp.

3. Nếu output báo "Empty event log" → giải thích: hook chưa fire trong window 7d. User cần:
   - Edit/Write file để post-write-check log block (nếu vi phạm rule)
   - End session để Stop hook log session_end
   - Chạy `/halluc-score` để log halluc_score event
   - Chạy `/verify` để log loop_retry + verify_done events

4. Nếu có signal đỏ → đề xuất action cụ thể:
   - RED rate > 10% → review hallucination rules
   - Rotate rate > 40% → review eager loads, context management
   - Cache hit < 20% → review CLAUDE.md structure for caching
   - Avg retries > 2.5 → review code quality, typecheck config
   - Schema staleness > 30d → run /schema-check

## Flags

```
--days N        Window size (default 7)
--json          JSON output cho parser khác
```

## 9 Metrics

| # | Metric | "Tốt" | "Cần xem lại" |
|---|---|---|---|
| 1 | Sessions + token efficiency | avg < 90k, rotate < 20% | avg > 120k, rotate > 40% |
| 2 | HRS distribution | RED < 5%, GREEN > 70% | RED > 10% |
| 3 | Hook blocks/session | 0.5–2 | 0 or > 5 |
| 4 | Phase 3 loop count | avg retries < 1.5 | > 2.5 |
| 5 | Classify frequency | match LOC growth | spike |
| 6 | Schema staleness | < 14d | > 30d |
| 7 | Cache efficiency | hit ≥ 50% | hit < 20% |
| 8 | Estimated cost | track trend | — |

## Liên quan

- `core/docs/METRICS.md` — design doc + collection mechanism
- `.claude/hooks/python/metrics_writer.py` — append-only writer (fail-open, auto-prune)
- `.claude/hooks/python/session-end.py` — Stop hook (token breakdown + cost)
- `.claude/hooks/python/memory_writer.py` — auto-writeback engine
- `.claude/config/thresholds.json` — thresholds + model pricing
- `.claude/metrics/events.jsonl` — event log (gitignored)
