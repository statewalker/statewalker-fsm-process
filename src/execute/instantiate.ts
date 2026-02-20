import { readFile } from "node:fs/promises";
import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { validate } from "@statewalker/fsm-validator";
import type { LanguageModelV1 } from "ai";
import { parse } from "yaml";
import {
  type ExecutionContext,
  setConfig,
  setModel,
  setParams,
} from "./context.ts";

export async function instantiate(options: {
  template: string | FsmStateConfig;
  params: Record<string, unknown>;
  model?: LanguageModelV1;
}): Promise<{ config: FsmStateConfig; context: ExecutionContext }> {
  let config: FsmStateConfig;

  if (typeof options.template === "string") {
    const yamlContent = await readFile(options.template, "utf-8");
    config = parse(yamlContent) as FsmStateConfig;
  } else {
    config = options.template;
  }

  // Validate — reject on structural errors
  const result = validate(config);
  if (!result.valid) {
    const messages = result.errors
      .map((e) => `[${e.rule}] ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Invalid config:\n${messages}`);
  }

  // Deep clone to keep template immutable
  config = structuredClone(config);

  const context: ExecutionContext = {};
  setConfig(context, config);
  setParams(context, options.params);
  if (options.model) {
    setModel(context, options.model);
  }

  return { config, context };
}
