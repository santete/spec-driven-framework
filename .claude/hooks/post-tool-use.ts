/**
 * PostToolUse hook — stub for Phase 0 M2.
 *
 * PRD §7.2 mục tiêu cuối: chạy spec-lint + trace-update sau mỗi Edit/Write.
 * M2 dừng ở stub (exit 0) để không can thiệp dev loop khi pipeline chưa đủ
 * primitive. M3 sẽ wire spec-lint + trace-update vào đây.
 */
export interface PostToolUseInput {
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: Record<string, unknown>;
}

export interface HookResult {
  exitCode: 0;
}

export function runPostToolUse(_input: PostToolUseInput): HookResult {
  return { exitCode: 0 };
}

import { fileURLToPath } from "node:url";
const invoked = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (invoked) {
  process.exit(0);
}
