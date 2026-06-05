#!/usr/bin/env python3
"""
Summarize .claude/metrics/events.jsonl → 7 framework metrics.

Usage:
  python .claude/hooks/python/metrics-summary.py [--days 7] [--json]

Metrics:
  1. HRS distribution (% GREEN/YELLOW/ORANGE/RED) — hallucination thực tế
  2. Hook block rate (BLOCKER/session) — rules có catch không
  3. Token efficiency (avg final, % rotate) — pipeline có waste context không
  4. Loop count (chưa capture, placeholder) — Phase 3 retries
  5. Classify frequency — re-classify cadence
  6. Schema staleness (median days) — ground truth rotting
  7. Cache efficiency (avg hit%, output tokens) — prompt cache + output tracking
"""
import argparse
import io
import json
import sys
import time
from collections import Counter
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

# Runtime thresholds (override via .claude/config/thresholds.json)
try:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'config'))
    from thresholds import load as _load_thresholds
    _cfg = _load_thresholds()
    ROTATE_THRESHOLD = int(_cfg.get('rotate_threshold', 120_000))
    METRICS_TOK_WARN = int(_cfg.get('metrics_tok_warn', 90_000))
except Exception:
    ROTATE_THRESHOLD, METRICS_TOK_WARN = 120_000, 90_000


def find_project_root() -> Path:
    cwd = Path.cwd()
    for p in [cwd] + list(cwd.parents):
        if (p / '.claude').is_dir() or (p / '.git').is_dir():
            return p
    return cwd


def load_events(path: Path, since_ts: int):
    if not path.exists():
        return []
    out = []
    try:
        with path.open('r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    ev = json.loads(line)
                    if ev.get('ts', 0) >= since_ts:
                        out.append(ev)
                except Exception:
                    continue
    except Exception:
        pass
    return out


def schema_age_days(root: Path) -> int:
    try:
        p = root / '.claude' / 'memory' / 'schema_snapshot.yaml'
        if not p.exists():
            return -1
        return int((time.time() - p.stat().st_mtime) / 86400)
    except Exception:
        return -1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--days', type=int, default=7)
    ap.add_argument('--json', action='store_true')
    args = ap.parse_args()

    root = find_project_root()
    log_path = root / '.claude' / 'metrics' / 'events.jsonl'
    since_ts = int(time.time()) - args.days * 86400
    events = load_events(log_path, since_ts)

    sessions = [e for e in events if e.get('event') == 'session_end']
    halluc_runs = [e for e in events if e.get('event') == 'halluc_score']
    blocks = [e for e in events if e.get('event') == 'hook_block']
    classify_runs = [e for e in events if e.get('event') == 'classify']
    verify_runs = [e for e in events if e.get('event') == 'verify_done']
    loop_retries = [e for e in events if e.get('event') == 'loop_retry']

    by_type = Counter(e.get('event') for e in events)
    hrs_colors = Counter(e.get('data', {}).get('color') for e in halluc_runs if e.get('data', {}).get('color'))
    blocks_by_hook = Counter(e.get('data', {}).get('hook') for e in blocks if e.get('data', {}).get('hook'))
    blocks_by_rule = Counter(e.get('data', {}).get('rule') for e in blocks if e.get('data', {}).get('rule'))

    tokens = [int(e.get('data', {}).get('final_tokens', 0)) for e in sessions]
    rotated_count = sum(1 for e in sessions if e.get('data', {}).get('rotated'))
    avg_tokens = (sum(tokens) / len(tokens)) if tokens else 0
    rotate_rate = (rotated_count / len(sessions) * 100) if sessions else 0
    block_per_session = (len(blocks) / len(sessions)) if sessions else 0

    # Phase 3 loop count (from verify_done + loop_retry events)
    verify_retries = [int(e.get('data', {}).get('total_retries', 0)) for e in verify_runs]
    avg_retries = (sum(verify_retries) / len(verify_retries)) if verify_retries else 0.0
    total_loop_retries = len(loop_retries)
    retries_by_gate = Counter(e.get('data', {}).get('gate') for e in loop_retries
                              if e.get('data', {}).get('gate'))
    escalated_count = sum(1 for e in verify_runs if e.get('data', {}).get('escalated'))

    # Token breakdown aggregates (from enriched session_end events)
    total_input = sum(int(e.get('data', {}).get('input_tokens', 0)) for e in sessions)
    total_cache_read = sum(int(e.get('data', {}).get('cache_read_input_tokens', 0)) for e in sessions)
    total_cache_create = sum(int(e.get('data', {}).get('cache_creation_input_tokens', 0)) for e in sessions)
    total_output = sum(int(e.get('data', {}).get('output_tokens', 0)) for e in sessions)
    total_context = total_input + total_cache_read + total_cache_create
    avg_cache_hit_pct = round(total_cache_read / total_context * 100, 1) if total_context > 0 else 0.0
    avg_output = round(total_output / len(sessions)) if sessions else 0
    # Per-session cache hit values for sessions that have breakdown data
    cache_hit_pcts = [float(e.get('data', {}).get('cache_hit_pct', 0)) for e in sessions
                      if e.get('data', {}).get('cache_hit_pct') is not None]

    # Cost estimation aggregates
    costs = [float(e.get('data', {}).get('estimated_cost_usd', 0)) for e in sessions]
    total_cost = sum(costs)
    avg_cost = (total_cost / len(costs)) if costs else 0.0

    schema_age = schema_age_days(root)
    pattern = '?'
    if events:
        pattern = events[-1].get('pattern', '?')

    if args.json:
        print(json.dumps({
            'window_days': args.days,
            'total_events': len(events),
            'pattern': pattern,
            'by_type': dict(by_type),
            'hrs_distribution': dict(hrs_colors),
            'sessions_count': len(sessions),
            'avg_final_tokens': round(avg_tokens),
            'rotate_rate_pct': round(rotate_rate, 1),
            'token_breakdown': {
                'total_input_tokens': total_input,
                'total_cache_read_tokens': total_cache_read,
                'total_cache_creation_tokens': total_cache_create,
                'total_output_tokens': total_output,
                'avg_cache_hit_pct': avg_cache_hit_pct,
                'avg_output_per_session': avg_output,
            },
            'loop_count': {
                'verify_runs': len(verify_runs),
                'avg_retries_per_verify': round(avg_retries, 2),
                'total_loop_retries': total_loop_retries,
                'retries_by_gate': dict(retries_by_gate),
                'escalated_count': escalated_count,
            },
            'blocks_per_session': round(block_per_session, 2),
            'blocks_by_hook': dict(blocks_by_hook),
            'blocks_by_rule': dict(blocks_by_rule),
            'classify_runs': len(classify_runs),
            'cost': {
                'total_usd': round(total_cost, 4),
                'avg_per_session_usd': round(avg_cost, 4),
            },
            'schema_age_days': schema_age,
            'log_path': str(log_path),
        }, ensure_ascii=False, indent=2))
        return

    D = '═' * 62

    if not events:
        print(f"\n{D}")
        print(f"  FRAMEWORK METRICS — last {args.days} days")
        print(D)
        print(f"\n  Empty event log. (path: {log_path})")
        print(f"  Hooks chưa fire trong window này. Cần:")
        print(f"    - Edit/Write file → post-write-check log block (nếu có violation)")
        print(f"    - End session → Stop hook log session_end")
        print(f"    - Run /halluc-score → log halluc_score event\n")
        return

    print(f"\n{D}")
    print(f"  FRAMEWORK METRICS — last {args.days} days  [{len(events)} events, pattern {pattern}]")
    print(D)

    # 1. Sessions + token efficiency
    rot_emoji = '🟢' if rotate_rate < 20 else ('🟡' if rotate_rate < 40 else '🔴')
    tok_emoji = '🟢' if avg_tokens < METRICS_TOK_WARN else ('🟡' if avg_tokens < ROTATE_THRESHOLD else '🔴')
    print(f"\n  [1] Sessions:           {len(sessions)}")
    print(f"      Avg final tokens:   {avg_tokens:>7,.0f}  {tok_emoji}  (target < {METRICS_TOK_WARN//1000}k)")
    print(f"      Rotate rate (≥{ROTATE_THRESHOLD//1000}k): {rotate_rate:>5.1f}%  {rot_emoji}  (target < 20%)")

    # 2. HRS distribution
    total_hrs = sum(hrs_colors.values())
    print(f"\n  [2] HRS distribution ({total_hrs} runs):")
    if total_hrs == 0:
        print(f"      (no /halluc-score runs in window)")
    else:
        for color in ('GREEN', 'YELLOW', 'ORANGE', 'RED'):
            n = hrs_colors.get(color, 0)
            pct = n / total_hrs * 100
            emoji = {'GREEN': '🟢', 'YELLOW': '🟡', 'ORANGE': '🟠', 'RED': '🔴'}[color]
            bar = '█' * int(pct / 5) if pct > 0 else ''
            print(f"      {emoji} {color:<7} {n:>3} ({pct:>5.1f}%) {bar}")
        red_pct = hrs_colors.get('RED', 0) / total_hrs * 100
        green_pct = hrs_colors.get('GREEN', 0) / total_hrs * 100
        if red_pct > 10:
            print(f"      🔴 RED rate {red_pct:.1f}% > 10% — hallucination chưa control")
        elif green_pct < 50:
            print(f"      🟡 GREEN rate {green_pct:.1f}% < 50% — verify thêm")

    # 3. Hook blocks
    blk_emoji = '🟢' if 0.5 <= block_per_session <= 2 else '🟡'
    print(f"\n  [3] Hook blocks:")
    print(f"      Per session:       {block_per_session:>6.2f}   {blk_emoji}  (target 0.5–2)")
    if block_per_session == 0:
        print(f"      ⚠️  Zero blocks — rules có thể vô dụng hoặc dev không touch hook category")
    elif block_per_session > 5:
        print(f"      🔴 > 5/session — false positive friction, review rule precision")
    if blocks_by_hook:
        for hook, n in blocks_by_hook.most_common():
            print(f"      {hook:<22} {n}")
    if blocks_by_rule:
        print(f"      Top rules:")
        for rule, n in blocks_by_rule.most_common(5):
            print(f"        {rule:<28} {n}")

    # 4. Phase 3 loop count
    print(f"\n  [4] Phase 3 loops:")
    if verify_runs:
        loop_emoji = '🟢' if avg_retries < 1.5 else ('🟡' if avg_retries < 2.5 else '🔴')
        print(f"      Verify runs:       {len(verify_runs):>6}")
        print(f"      Avg retries/verify:{avg_retries:>6.1f}   {loop_emoji}  (target < 1.5)")
        print(f"      Total loop retries:{total_loop_retries:>6}")
        if retries_by_gate:
            print(f"      By gate:")
            for gate, n in retries_by_gate.most_common():
                print(f"        {gate:<20} {n}")
        if escalated_count:
            print(f"      Escalated to user: {escalated_count}")
    else:
        print(f"      (no /verify runs in window — loop count tracked when /verify is used)")

    # 5. Classify frequency
    print(f"\n  [5] Classify runs:      {len(classify_runs)}")

    # 6. Schema staleness (live, not from events)
    if schema_age >= 0:
        sch_emoji = '🟢' if schema_age < 14 else ('🟡' if schema_age < 30 else '🔴')
        print(f"\n  [6] Schema staleness:   {schema_age}d  {sch_emoji}  (target < 14d)")

    # 7. Cache efficiency + output tokens
    print(f"\n  [7] Token breakdown (aggregate):")
    if total_context > 0:
        cache_emoji = '🟢' if avg_cache_hit_pct >= 50 else ('🟡' if avg_cache_hit_pct >= 20 else '🔴')
        print(f"      Input (fresh):     {total_input:>10,}")
        print(f"      Cache read:        {total_cache_read:>10,}")
        print(f"      Cache creation:    {total_cache_create:>10,}")
        print(f"      Cache hit rate:    {avg_cache_hit_pct:>8.1f}%  {cache_emoji}  (target ≥ 50%)")
        print(f"      Output tokens:     {total_output:>10,}")
        print(f"      Avg output/session:{avg_output:>10,}")
    else:
        print(f"      (no token breakdown data — sessions may predate this feature)")

    # 8. Cost estimation
    if total_cost > 0:
        print(f"\n  [8] Estimated cost (default model pricing):")
        print(f"      Total ({args.days}d):     ${total_cost:>10.4f}")
        print(f"      Avg per session:   ${avg_cost:>10.4f}")
    else:
        print(f"\n  [8] Cost: (no cost data — sessions may predate cost tracking)")

    print(f"\n  Source: {log_path.relative_to(root) if log_path.is_relative_to(root) else log_path}")
    print(f"{D}\n")


if __name__ == '__main__':
    main()
