import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

export interface SchemaError {
  instancePath: string;
  message: string;
}

let cachedValidate: ValidateFunction | undefined;

export function loadSchemaValidator(repoRoot: string): ValidateFunction {
  if (cachedValidate) return cachedValidate;
  const schemaPath = join(repoRoot, "specs", "spec-schema.json");
  const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  cachedValidate = ajv.compile(schema);
  return cachedValidate;
}

export function validateFrontmatter(
  data: unknown,
  validate: ValidateFunction,
): SchemaError[] {
  const ok = validate(data);
  if (ok) return [];
  return (validate.errors || []).map((e: ErrorObject) => ({
    instancePath: e.instancePath || "(root)",
    message: e.message || "schema violation",
  }));
}

/** Reset cache (test-only). */
export function _resetValidatorCache(): void {
  cachedValidate = undefined;
}
