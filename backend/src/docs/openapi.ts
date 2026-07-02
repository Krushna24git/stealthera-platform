import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type { Request, Response } from "express";

const here = dirname(fileURLToPath(import.meta.url));
const specPath = resolve(here, "../../openapi.yaml");

let raw = "";
let document: Record<string, unknown> = {};

export function loadOpenApi(): Record<string, unknown> {
  raw = readFileSync(specPath, "utf8");
  document = parse(raw) as Record<string, unknown>;
  return document;
}

export function getOpenApiDocument(): Record<string, unknown> {
  if (!raw) loadOpenApi();
  return document;
}

export function serveOpenApiYaml(_req: Request, res: Response): void {
  if (!raw) loadOpenApi();
  res.type("application/yaml").send(raw);
}
