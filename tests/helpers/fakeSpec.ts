import type { SpecFile, SpecFrontmatter } from "../../src/keystone/types.js";

/**
 * Build a synthetic SpecFile for unit tests — no I/O.
 */
export function fakeSpec(
  data: Partial<SpecFrontmatter> & Pick<SpecFrontmatter, "id" | "type" | "title" | "version">,
  relPath?: string,
): SpecFile {
  const rp = relPath ?? `specs/_test/${data.id}.md`;
  return {
    path: `/fake/${rp}`,
    relPath: rp,
    data: { ...data } as SpecFrontmatter,
    body: "",
    raw: "",
  };
}
