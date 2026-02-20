import { instantiate } from "../execute/instantiate.ts";
import { run } from "../execute/runner.ts";
import type { CliOptions } from "./index.ts";
import { resolveModel } from "./model.ts";

export async function runExecuteCommand(opts: CliOptions): Promise<number> {
  const templatePath = opts.positional[0];
  if (!templatePath) {
    console.error(
      "Usage: fsm-process execute <template.yaml> [--param key=value] [--model provider:model]",
    );
    return 2;
  }

  try {
    const model = resolveModel(opts.model);
    const { config, context } = await instantiate({
      template: templatePath,
      params: opts.params,
      model,
    });

    const { done } = await run({
      config,
      context,
      handlers: {},
    });

    await done;
    return 0;
  } catch (err) {
    console.error("Execute failed:", err);
    return 1;
  }
}
