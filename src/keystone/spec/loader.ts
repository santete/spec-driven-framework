import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import matter from "gray-matter";
import type { SpecFile, SpecFrontmatter } from "../types.js";

const SKIP_DIRS = new Set(["openapi", "_examples", "node_modules", ".git"]);

/** Recursively list all *.md spec files under a directory. */
export function listSpecFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      out.push(...listSpecFiles(full));
    } else if (entry.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

/** Parse a single spec file (frontmatter + body). */
export function loadSpec(absPath: string, repoRoot: string): SpecFile {
  const raw = readFileSync(absPath, "utf8");
  const parsed = matter(raw);
  return {
    path: absPath,
    relPath: relative(repoRoot, absPath).split(sep).join("/"),
    data: parsed.data as SpecFrontmatter,
    body: parsed.content,
    raw,
  };
}

/** Load all specs from a directory. */
export function loadAllSpecs(specsDir: string, repoRoot: string): SpecFile[] {
  return listSpecFiles(specsDir).map((p) => loadSpec(p, repoRoot));
}

/** Find the PROJECT artifact among loaded specs. SR10 — exactly one expected. */
export function findProject(specs: SpecFile[]): SpecFile | undefined {
  return specs.find((s) => s.data.type === "project");
}
