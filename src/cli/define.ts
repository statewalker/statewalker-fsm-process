import { setGenerateObject } from "../define/context.ts";
import { runDefine } from "../define/run.ts";
import type { CliOptions } from "./index.ts";
import { resolveGenerateObject } from "./model.ts";
import { readStdin } from "./pipe.ts";

export async function runDefineCommand(opts: CliOptions): Promise<number> {
  // Support piping: if no --input flag and no prompt, check stdin
  const input = opts.input;
  if (!input && !opts.params.prompt) {
    const stdinData = await readStdin();
    if (stdinData) {
      opts.params.prompt = stdinData;
    }
  }

  const context: Record<string, unknown> = {
    params: {
      input,
      output: opts.output,
      prompt: opts.params.prompt,
      validateOnly: opts.validateOnly ?? false,
    },
    resolved: {},
  };

  const generateObject = resolveGenerateObject(opts.model);
  setGenerateObject(context, generateObject);

  try {
    const { done } = await runDefine(context);
    await done;

    // For piping: output the resolved config as YAML to stdout when no --output
    if (!opts.output) {
      const resolved = (context as Record<string, unknown>).resolved as
        | Record<string, unknown>
        | undefined;
      if (resolved?.config) {
        const { stringify } = await import("yaml");
        process.stdout.write(stringify(resolved.config));
      }
    }

    return 0;
  } catch (err) {
    console.error("Define failed:", err);
    return 1;
  }
}
