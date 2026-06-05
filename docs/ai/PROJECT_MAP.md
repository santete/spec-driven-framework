# Project Map

> "Bản đồ" để AI agent hiểu nhanh kiến trúc project. Đọc file này TRƯỚC khi
> đoán file ở đâu. Cập nhật khi cấu trúc thay đổi đáng kể.

---

## Tech Stack

- **Language**: TypeScript 5.x (ES2022 target, ESNext modules)
- **Runtime**: Node.js >=22
- **Test**: Vitest 2.x
- **Lint / Format**: N/A (not configured yet)
- **Package manager**: npm (package-lock.json)
- **Schema validation**: Ajv 8.x + ajv-formats
- **YAML parsing**: gray-matter 4.x, yaml 2.x
- **TS execution**: tsx 4.x

---

## Folder Structure

```
project-root/
├── src/keystone/             # Core framework source
│   ├── cli/                  # CLI entry points (spec-change, s0, status, resume, abort)
│   ├── intake/               # S0 Intake QC checks (IQ1-IQ8)
│   │   └── checks/           # Individual intake check implementations
│   ├── lint/                 # Spec linting rules (SR1, SR3, SR4, SR6)
│   │   └── rules/            # Individual lint rule implementations
│   ├── orchestrator/         # Pipeline orchestrator (state machine, store, stations)
│   ├── spec/                 # Spec loader + validator
│   └── types.ts              # Shared type definitions
├── tests/                    # Test suites
│   ├── e2e/                  # End-to-end CLI tests
│   ├── helpers/              # Test utilities (fakeSpec, repoFixture)
│   ├── intake/               # Intake check + runner tests
│   ├── lint/                 # Lint rule tests
│   ├── orchestrator/         # Orchestrator machine/runner/store tests
│   └── schema/               # Schema validation tests
├── specs/                    # Spec artifacts (Markdown w/ YAML frontmatter)
│   ├── auth/                 # Auth domain specs (sample)
│   └── spec-schema.json      # JSON Schema for spec frontmatter (PRD §8.2)
├── docs/                     # Documentation
│   └── ai/                   # AI agent rules
└── .claude/                  # Claude Code harness config
```

---

## Key Modules / Domains

| Module       | Path                          | Responsibility                                    |
|-------------|-------------------------------|---------------------------------------------------|
| cli         | `src/keystone/cli/`           | CLI commands: spec-change, s0, status, resume, abort |
| intake      | `src/keystone/intake/`        | S0 Intake QC — 8 checks (IQ1-IQ8) on spec quality |
| lint        | `src/keystone/lint/`          | Spec linting — structural rules (SR1, SR3, SR4, SR6) |
| orchestrator| `src/keystone/orchestrator/`  | Pipeline state machine (S0-S8), run store, station dispatch |
| spec        | `src/keystone/spec/`          | Spec file loading, YAML frontmatter parsing, validation |
| types       | `src/keystone/types.ts`       | Shared TypeScript types                           |

---

## Important Files

- `package.json`               — Scripts: test, test:watch, typecheck
- `tsconfig.json`              — TypeScript config (strict, noEmit)
- `specs/spec-schema.json`     — JSON Schema for spec frontmatter validation
- `src/keystone/types.ts`      — Core type definitions
- `vitest.config.ts`           — Vitest configuration

---

## Build / Run / Test commands

```bash
# Setup
npm install

# Test
npm test                      # vitest run
npm run test:watch            # vitest (watch mode)

# Typecheck
npm run typecheck             # tsc --noEmit

# Run CLI (via tsx)
npx tsx src/keystone/cli/spec-change.ts
npx tsx src/keystone/cli/s0.ts
npx tsx src/keystone/cli/status.ts
```

---

## Architectural Decisions

- **Spec-driven framework**: All features defined as Markdown specs with YAML frontmatter, validated against JSON Schema
- **Pipeline model (S0-S8)**: Governed 9-station pipeline with rework budgets; Phase 0 M3 has S0 real + S1-S8 stubs
- **No bundler/build step**: TypeScript with `noEmit` — runs via tsx, tests via vitest
- **Frontmatter-based metadata**: Specs use gray-matter for parsing YAML frontmatter from Markdown files

---

## What NOT to touch (without asking)

- `specs/spec-schema.json` — Shared schema, changes affect all spec validation
- `docs/ai/` — AI agent rules, follow pipeline to modify
- `.claude/` — Harness config, use designated commands
