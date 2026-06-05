---
description: "Initialize Keystone project — choose tech stack, generate PROJECT artifact"
argument-hint: "--name <project> --stack <stack-id>"
---

# /init

Setup wizard for new Keystone projects. Generates `specs/project.md` with the correct stack profile.

## Cách dùng

**Option A — Interactive (Claude guides):**
```bash
/init
```
Claude will ask:
1. Project name?
2. Pick a tech stack (shows catalog)
3. Short description?

Then generates `specs/project.md`.

**Option B — Direct:**
```bash
/init --name my-api --stack web-service-ts-fastify
/init --name payments --stack web-service-dotnet-minimal --description "Payment processing service"
/init --name gateway --stack web-service-go-chi
```

## Available Stacks

```bash
npx tsx src/keystone/cli/init.ts --list-stacks
```

| Stack ID | Language | Framework | ORM | Test |
|----------|----------|-----------|-----|------|
| `web-service-ts-fastify` | TypeScript | Fastify | Drizzle | Vitest |
| `web-service-python-fastapi` | Python | FastAPI | SQLAlchemy | pytest |
| `web-service-dotnet-minimal` | C# | ASP.NET Minimal | EF Core | xUnit |
| `web-service-go-chi` | Go | Chi | sqlc | go test |
| `web-service-java-spring` | Java | Spring Boot | JPA | JUnit 5 |

## Interactive Flow

When user runs `/init` without args, Claude should:

1. Greet and explain Keystone briefly
2. Ask project name
3. Show stack catalog table and ask user to pick
4. Ask for a short description
5. Run:
   ```bash
   npx tsx src/keystone/cli/init.ts --name <name> --stack <stack-id> --description "<desc>"
   ```
6. Show output
7. Suggest next step: `/brd-intake` or write specs manually

## What It Generates

`specs/project.md`:
```yaml
---
id: PROJECT-MY-API
type: project
title: "My API service"
version: 1.0.0
status: approved
profile: web-service-ts-fastify
stack:
  language: typescript
  runtime: node22
  http: fastify
  orm: drizzle
  db: { dev: sqlite, prod: postgres }
non_functional_defaults:
  latency_p95_ms: 300
  availability_pct: 99.9
codegen_conventions:
  module_layout: feature-folder
  test_layout: alongside
  error_format: rfc7807
rework:
  k_global: 5
---
```

## After Init

```
/init → specs/project.md created
  → /brd-intake docs/brd/feature.md    (import BRD)
  → /spec-change --title "First feature"  (run pipeline)
  → /dashboard                           (view progress)
```
