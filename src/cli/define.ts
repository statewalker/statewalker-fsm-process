import { setGenerateObject } from "../define/context.ts";
import { runDefine } from "../define/run.ts";
import type { CliOptions } from "./index.ts";
import { resolveGenerateObject } from "./model.ts";

export async function runDefineCommand(opts: CliOptions): Promise<number> {
  const context: Record<string, unknown> = {
    params: {
      input: opts.input,
      output: opts.output,
      prompt: opts.params.prompt,
    },
    resolved: {},
  };

  const generateObject = resolveGenerateObject(opts.model);
  setGenerateObject(context, generateObject);

  try {
    const { done } = await runDefine(context);
    await done;
    return 0;
  } catch (err) {
    console.error("Define failed:", err);
    return 1;
  }
}
