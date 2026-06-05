#!/usr/bin/env python3
"""
Hook: Stop — Claude Code session ends.
Write `session_end` event với final tokens + rotated flag, sau đó nudge
drift_check để emit `drift_nudge` event nếu memory đã lệch baseline.
Fail-open: bất kỳ exception nào → exit 0 (không block shutdown).
"""
import json
import subprocess
import sys
from pathlib import Path

try:
    sys.path.insert(0, str(Path(__file__).parent))
    from metrics_writer import find_project_root, write_event

    try:
        sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'config'))
        from thresholds import load as _load_thresholds
        _cfg = _load_thresholds()
        _rotate_threshold = int(_cfg.get('rotate_threshold', 120_000))
        _model_costs = _cfg.get('model_costs', {})
    except Exception:
        _rotate_threshold = 120_000
        _model_costs = {}

    stdin_data = {}
    try:
        stdin_data = json.loads(sys.stdin.read() or "{}")
    except Exception:
        pass

    root = find_project_root()

    final_tokens = 0
    input_tok = 0
    cache_read_tok = 0
    cache_create_tok = 0
    output_tok = 0
    try:
        cache = root / '.claude' / 'cache' / 'last_tokens.json'
        if cache.exists():
            cached = json.loads(cache.read_text(encoding='utf-8'))
            final_tokens = int(cached.get('tokens', 0))
            input_tok = int(cached.get('input_tokens', 0))
            cache_read_tok = int(cached.get('cache_read_input_tokens', 0))
            cache_create_tok = int(cached.get('cache_creation_input_tokens', 0))
            output_tok = int(cached.get('output_tokens', 0))
    except Exception:
        pass

    rotated = bool(stdin_data.get('rotated')) or final_tokens >= _rotate_threshold

    # Cache hit ratio: % of context tokens served from prompt cache
    cache_total = input_tok + cache_read_tok + cache_create_tok
    cache_hit_pct = round(cache_read_tok / cache_total * 100, 1) if cache_total > 0 else 0.0

    # Cost estimation (fail-open, uses model_costs from thresholds.json)
    estimated_cost = 0.0
    cost_model = 'none'
    if _model_costs and (input_tok + cache_read_tok + cache_create_tok + output_tok) > 0:
        # Try to match model from last_tokens cache or default
        pricing = _model_costs.get('default', {})
        for key in ('opus', 'sonnet', 'haiku'):
            if key in _model_costs:
                pricing = _model_costs.get('default', pricing)
                break
        # Read model hint from statusline cache if available
        try:
            cache_data = json.loads((root / '.claude' / 'cache' / 'last_tokens.json').read_text(encoding='utf-8'))
            # statusline doesn't store model — use default pricing
        except Exception:
            pass
        if pricing:
            cost_model = 'default'
            estimated_cost = round(
                input_tok * float(pricing.get('input_per_1m', 0)) / 1_000_000 +
                cache_read_tok * float(pricing.get('cache_read_per_1m', 0)) / 1_000_000 +
                cache_create_tok * float(pricing.get('cache_create_per_1m', 0)) / 1_000_000 +
                output_tok * float(pricing.get('output_per_1m', 0)) / 1_000_000,
                4
            )

    write_event('session_end', {
        'final_tokens': final_tokens,
        'input_tokens': input_tok,
        'cache_read_input_tokens': cache_read_tok,
        'cache_creation_input_tokens': cache_create_tok,
        'output_tokens': output_tok,
        'cache_hit_pct': cache_hit_pct,
        'estimated_cost_usd': estimated_cost,
        'cost_model': cost_model,
        'rotated': rotated,
        'session_id': stdin_data.get('session_id', ''),
    }, root=root)

    # Drift nudge — fire-and-forget. We don't print at session end (the
    # session is already closing); we just record an event so /metrics can
    # show how often sessions ended with drift outstanding.
    try:
        drift_script = Path(__file__).parent / 'drift_check.py'
        proc = subprocess.run(
            ['python', str(drift_script), '--json'],
            cwd=str(root),
            capture_output=True,
            text=True,
            timeout=5,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            payload = json.loads(proc.stdout.strip())
            if payload.get('status') == 'drift':
                write_event('drift_nudge', {
                    'baseline': payload.get('baseline', '')[:8],
                    'committed': len(payload.get('committed', [])),
                    'uncommitted': len(payload.get('uncommitted', [])),
                }, root=root)
    except Exception:
        pass

except Exception:
    pass

sys.exit(0)
