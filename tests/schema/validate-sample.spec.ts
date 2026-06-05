import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import matter from "gray-matter";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ROOT = process.cwd();
const SCHEMA_PATH = join(ROOT, "specs", "spec-schema.json");
const SPECS_DIR = join(ROOT, "specs");

function listSpecFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (["openapi", "sdd"].includes(entry) || entry.startsWith("_")) continue;
      out.push(...listSpecFiles(full));
    } else if (entry.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);
const files = listSpecFiles(SPECS_DIR);

describe("spec-schema validates sample specs (M1 sanity)", () => {
  it("found at least one spec file", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [relative(ROOT, f).split(sep).join("/")]))(
    "validates %s",
    (rel) => {
      const abs = join(ROOT, rel);
      const content = readFileSync(abs, "utf8");
      const parsed = matter(content);
      const ok = validate(parsed.data);
      if (!ok) {
        const errors = (validate.errors || [])
          .map((e) => `  - ${e.instancePath || "(root)"} ${e.message}`)
          .join("\n");
        throw new Error(
          `Frontmatter invalid for ${rel}:\n${errors}\n\nParsed frontmatter:\n${JSON.stringify(parsed.data, null, 2)}`,
        );
      }
      expect(ok).toBe(true);
    },
  );

  it("every spec has top-level id matching the filename stem (sanity)", () => {
    for (const f of files) {
      const content = readFileSync(f, "utf8");
      const parsed = matter(content);
      const id = (parsed.data as { id?: string }).id;
      expect(id, `missing id in ${relative(ROOT, f)}`).toBeTruthy();
      const stem = f.split(sep).pop()!.replace(/\.md$/, "");
      if (stem !== "project") {
        expect(id, `id should match filename stem in ${relative(ROOT, f)}`).toBe(stem);
      }
    }
  });
});
