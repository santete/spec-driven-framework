---
id: PROJECT-KEYSTONE-DEMO
type: project
title: "Keystone Phase 1 demo service"
version: 1.0.0
status: approved
owner: team-keystone
created: "2026-06-04"
updated: "2026-06-04"
tags: [phase-0, demo]
profile: web-service-ts-fastify
profile_source: catalog
stack:
  language: typescript
  runtime: node22
  http: fastify
  validation: zod
  orm: drizzle
  db:
    dev: sqlite
    prod: postgres
  test: vitest
  adversarial_test: fast-check
  package_manager: pnpm
constraints:
  cloud: aws
  region: ap-southeast-1
  budget_tier: lean
  team_size: 3
non_functional_defaults:
  latency_p95_ms: 300
  availability: 99.9
  rps_target: 1000
codegen_conventions:
  module_layout: feature-folder
  test_layout: alongside
  error_format: rfc7807
feedback_style: detailed
rework:
  k_self_default: 1
  k_self_overrides:
    S5: 2
    S6: 2
    S7: 0
  k_global: 5
  k_customer_reject_s5: 3
  k_customer_retry_s0: 5
  on_global_exceeded: incident
  rework_token_budget_pct: 30
---

# PROJECT-KEYSTONE-DEMO

Project artifact cho Phase 1 demo service. Một repo chỉ có **đúng một** `PROJECT` artifact (SR10).

## Mục đích

Phase 0 — Scaffold. Stack mặc định `web-service-ts-fastify` (PRD §15.2). Dùng để chứng minh dây chuyền 9 trạm chạy E2E trên một spec mẫu (`REQ-AUTH-001`).

## Stack rationale

Xem PRD §15.2 — TS + Fastify + Zod + Drizzle + Vitest + fast-check. Bidirectional Zod ↔ JSON Schema giúp `SCHEMA` artifact sinh được type + runtime validator cùng nguồn.

## Rework policy

`K_global=5`, `K_self` phân hóa theo bản chất trạm (S5/S6 LLM-driven = 2; S7 test = 0; còn lại = 1). Tham khảo PRD §7.5.1.
