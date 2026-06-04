/**
 * Test helper: clones the project's `specs/` tree (and required scaffolding)
 * into a temp directory so E2E CLI tests don't pollute the real `.keystone/`.
 *
 * Cheaper than `cp -r` via a manual recursive copy — keeps deps to zero.
 */
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export function makeRepoFixture(sourceRepoRoot: string = process.cwd()): string {
  const tmp = mkdtempSync(join(tmpdir(), "keystone-repo-"));
  cpSync(resolve(sourceRepoRoot, "specs"), join(tmp, "specs"), {
    recursive: true,
  });
  mkdirSync(join(tmp, ".trace"), { recursive: true });
  // ownership.yaml is read by future stations; keep an empty placeholder so
  // any future loader doesn't crash when invoked from the fixture.
  cpSync(
    resolve(sourceRepoRoot, ".trace", "ownership.yaml"),
    join(tmp, ".trace", "ownership.yaml"),
  );
  return tmp;
}

export function tearDownFixture(path: string): void {
  rmSync(path, { recursive: true, force: true });
}
