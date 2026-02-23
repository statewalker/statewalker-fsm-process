import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { StageHandler } from "@statewalker/fsm";
import { stringify } from "yaml";

export type ExecutionContext = Record<string, unknown>;

export function createDefineContext(
  overrides: Record<string, unknown> = {},
): ExecutionContext {
  return {
    params: {
      input: undefined,
      output: undefined,
      ...(overrides.params as Record<string, unknown>),
    },
    resolved: { ...(overrides.resolved as Record<string, unknown>) },
    ...overrides,
  };
}

export function createExecutionContext(
  params: Record<string, unknown> = {},
  config?: unknown,
): ExecutionContext {
  const ctx: ExecutionContext = { params };
  if (config !== undefined) {
    ctx.config = config;
  }
  return ctx;
}

export async function writeTempFile(
  content: string,
): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), "fsm-process-test-"));
  const path = join(dir, "input.txt");
  await writeFile(path, content, "utf-8");
  return { path, cleanup: () => rm(dir, { recursive: true }) };
}

export async function writeTempYaml(
  config: unknown,
): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), "fsm-process-test-"));
  const path = join(dir, "config.yaml");
  await writeFile(path, stringify(config), "utf-8");
  return { path, cleanup: () => rm(dir, { recursive: true }) };
}

export async function collectEvents(
  handler: StageHandler<ExecutionContext>,
  context: ExecutionContext,
): Promise<{ events: string[]; cleanup?: () => void | Promise<void> }> {
  const events: string[] = [];
  const result = await handler(context);

  if (result && typeof result === "object" && Symbol.asyncIterator in result) {
    for await (const event of result as AsyncGenerator<string>) {
      events.push(event);
    }
    return { events };
  }
  if (result && typeof result === "object" && Symbol.iterator in result) {
    for (const event of result as Generator<string>) {
      events.push(event);
    }
    return { events };
  }
  if (typeof result === "function") {
    return { events, cleanup: result };
  }
  return { events };
}

export function mockGenerateObject(
  responses: unknown[],
): (opts: {
  prompt: string;
  schema: unknown;
  system?: string;
}) => Promise<{ object: unknown }> {
  let index = 0;
  return async () => {
    const response = responses[index % responses.length];
    index++;
    return { object: response };
  };
}

export function mockSequence<T>(responses: T[]): () => T {
  let index = 0;
  return () => {
    const result = responses[index % responses.length];
    index++;
    return result;
  };
}
