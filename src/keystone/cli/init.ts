/**
 * CLI: `npx tsx src/keystone/cli/init.ts`
 *
 * Interactive setup wizard — generates specs/project.md with the correct
 * stack profile based on user's tech stack choices.
 *
 * Also used by /init slash command in Claude Code.
 */
import { resolve } from "node:path";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

// ── Stack catalog ─────────────────────────────────────────────────

export interface StackProfile {
  id: string;
  label: string;
  language: string;
  runtime: string;
  http: string;
  orm: string;
  db: { dev: string; prod: string };
  test: string;
  validation: string;
  package_manager: string;
  observability: { logging: string; tracing: string; metrics: string };
}

export const STACK_CATALOG: StackProfile[] = [
  {
    id: "web-service-ts-fastify",
    label: "TypeScript + Fastify",
    language: "typescript", runtime: "node22",
    http: "fastify", orm: "drizzle", db: { dev: "sqlite", prod: "postgres" },
    test: "vitest", validation: "zod", package_manager: "npm",
    observability: { logging: "pino", tracing: "@opentelemetry/sdk-node", metrics: "prom-client" },
  },
  {
    id: "web-service-python-fastapi",
    label: "Python + FastAPI",
    language: "python", runtime: "python3.12",
    http: "fastapi", orm: "sqlalchemy", db: { dev: "sqlite", prod: "postgres" },
    test: "pytest", validation: "pydantic", package_manager: "pip",
    observability: { logging: "structlog", tracing: "opentelemetry-sdk", metrics: "prometheus_client" },
  },
  {
    id: "web-service-dotnet-minimal",
    label: ".NET 8 Minimal API",
    language: "csharp", runtime: "dotnet8",
    http: "aspnet-minimal", orm: "ef-core", db: { dev: "sqlite", prod: "sqlserver" },
    test: "xunit", validation: "fluentvalidation", package_manager: "dotnet",
    observability: { logging: "serilog", tracing: "OpenTelemetry.NET", metrics: "prometheus-net" },
  },
  {
    id: "web-service-go-chi",
    label: "Go + Chi",
    language: "go", runtime: "go1.22",
    http: "chi", orm: "sqlc", db: { dev: "sqlite", prod: "postgres" },
    test: "go-test", validation: "validator", package_manager: "go-mod",
    observability: { logging: "slog", tracing: "go.opentelemetry.io/otel", metrics: "prometheus/client_golang" },
  },
  {
    id: "web-service-java-spring",
    label: "Java + Spring Boot",
    language: "java", runtime: "java21",
    http: "spring-boot", orm: "jpa", db: { dev: "h2", prod: "postgres" },
    test: "junit5", validation: "jakarta-validation", package_manager: "maven",
    observability: { logging: "slf4j+logback", tracing: "opentelemetry-javaagent", metrics: "micrometer" },
  },
];

// ── PROJECT artifact generator ────────────────────────────────────

export function generateProjectArtifact(opts: {
  name: string;
  description: string;
  stack: StackProfile;
  teamSize?: number;
}): string {
  const frontmatter = {
    id: `PROJECT-${opts.name.toUpperCase().replace(/[^A-Z0-9]/g, "-")}`,
    type: "project",
    title: opts.description,
    version: "1.0.0",
    status: "approved",
    profile: opts.stack.id,
    stack: {
      language: opts.stack.language,
      runtime: opts.stack.runtime,
      http: opts.stack.http,
      orm: opts.stack.orm,
      db: opts.stack.db,
    },
    non_functional_defaults: {
      latency_p95_ms: 300,
      availability_pct: 99.9,
      rps_target: 1000,
    },
    codegen_conventions: {
      module_layout: "feature-folder",
      test_layout: "alongside",
      error_format: "rfc7807",
    },
    observability: {
      logging: { format: "json", redact: ["password", "token", "secret", "authorization"] },
      tracing: { protocol: "otlp", propagation: "w3c-tracecontext" },
      metrics: { format: "prometheus", endpoint: "/metrics" },
      health: { liveness: "/health", readiness: "/ready" },
    },
    rework: {
      k_global: 5,
      k_self_overrides: { S5: 2, S6: 2, S7: 0 },
    },
  };

  return `---\n${YAML.stringify(frontmatter)}---\n\n# ${frontmatter.id}\n\n${opts.description}\n`;
}

// ── Init result ───────────────────────────────────────────────────

export interface InitResult {
  exitCode: number;
  stdout: string;
  projectPath?: string;
}

export function runInit(opts: {
  name: string;
  description: string;
  stackId: string;
  repoRoot: string;
  force?: boolean;
}): InitResult {
  const specsDir = resolve(opts.repoRoot, "specs");
  const projectPath = resolve(specsDir, "project.md");

  // Check if already initialized
  if (existsSync(projectPath) && !opts.force) {
    const existing = readFileSync(projectPath, "utf8");
    if (existing.includes("status: approved") && !existing.includes("TODO")) {
      return {
        exitCode: 2,
        stdout: [
          "⚠️  Project already initialized: specs/project.md exists.",
          "",
          "Use --force to overwrite, or edit specs/project.md manually.",
        ].join("\n"),
      };
    }
  }

  // Find stack profile
  const stack = STACK_CATALOG.find((s) => s.id === opts.stackId);
  if (!stack) {
    return {
      exitCode: 2,
      stdout: [
        `❌ Unknown stack: ${opts.stackId}`,
        "",
        "Available stacks:",
        ...STACK_CATALOG.map((s) => `  ${s.id.padEnd(35)} ${s.label}`),
      ].join("\n"),
    };
  }

  // Generate PROJECT artifact
  const content = generateProjectArtifact({
    name: opts.name,
    description: opts.description,
    stack,
  });

  mkdirSync(specsDir, { recursive: true });
  writeFileSync(projectPath, content, "utf8");

  // Also create basic directories
  mkdirSync(resolve(opts.repoRoot, ".trace"), { recursive: true });
  if (!existsSync(resolve(opts.repoRoot, ".trace", "ownership.yaml"))) {
    writeFileSync(
      resolve(opts.repoRoot, ".trace", "ownership.yaml"),
      "version: 1\nownership: {}\n",
      "utf8",
    );
  }

  const lines = [
    "╔══════════════════════════════════════════════════════════════╗",
    "║  🔑 KEYSTONE INITIALIZED                                   ║",
    "╠══════════════════════════════════════════════════════════════╣",
    `║  Project: ${opts.name.padEnd(48)}║`,
    `║  Stack:   ${stack.label.padEnd(48)}║`,
    `║  Profile: ${stack.id.padEnd(48)}║`,
    "╚══════════════════════════════════════════════════════════════╝",
    "",
    "📄 Generated: specs/project.md",
    "",
    `  Language:    ${stack.language}`,
    `  Runtime:     ${stack.runtime}`,
    `  HTTP:        ${stack.http}`,
    `  ORM:         ${stack.orm}`,
    `  DB:          ${stack.db.dev} (dev) / ${stack.db.prod} (prod)`,
    `  Test:        ${stack.test}`,
    `  Validation:  ${stack.validation}`,
    "",
    "Next steps:",
    "  1. Write specs:       specs/<domain>/<ID>.md",
    "  2. Or import BRD:     /brd-intake docs/brd/your-feature.md",
    "  3. Run pipeline:      /spec-change --title \"Your first feature\"",
    "  4. View dashboard:    /dashboard",
  ];

  return { exitCode: 0, stdout: lines.join("\n"), projectPath };
}

// ── CLI entry (non-interactive — args-based) ──────────────────────

const invoked = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (invoked) {
  const args = process.argv.slice(2);

  if (args.includes("--list-stacks")) {
    console.log("Available stacks:\n");
    for (const s of STACK_CATALOG) {
      console.log(`  ${s.id}`);
      console.log(`    ${s.label}: ${s.language} + ${s.http} + ${s.orm} + ${s.test}`);
      console.log("");
    }
    process.exit(0);
  }

  const nameIdx = args.indexOf("--name");
  const descIdx = args.indexOf("--description");
  const stackIdx = args.indexOf("--stack");
  const force = args.includes("--force");

  if (nameIdx < 0 || stackIdx < 0) {
    console.log(`Usage: npx tsx src/keystone/cli/init.ts --name <project> --stack <stack-id> [--description "..."] [--force]`);
    console.log(`       npx tsx src/keystone/cli/init.ts --list-stacks`);
    console.log("");
    console.log("Stacks: " + STACK_CATALOG.map((s) => s.id).join(", "));
    process.exit(2);
  }

  const result = runInit({
    name: args[nameIdx + 1],
    description: descIdx >= 0 ? args[descIdx + 1] : args[nameIdx + 1],
    stackId: args[stackIdx + 1],
    repoRoot: process.cwd(),
    force,
  });

  process.stdout.write(result.stdout + "\n");
  process.exit(result.exitCode);
}
