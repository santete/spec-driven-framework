import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "tests/**/*.spec.ts",
      ".claude/hooks/__tests__/**/*.spec.ts",
      ".claude/skills/**/__tests__/**/*.spec.ts",
    ],
    exclude: [
      "tests/generated/**",
      "src/generated/**",
      "node_modules/**",
    ],
  },
});
