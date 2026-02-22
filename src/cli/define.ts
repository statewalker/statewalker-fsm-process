import { setGenerateObject } from "../adapters/generate-object.adapter.ts";
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

  // TODO: implement --validate-only (see umbrella-64v.5)
  const context: Record<string, unknown> = {
    params: {
      input,
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

    const resolved = (context as Record<string, unknown>).resolved as
      | Record<string, unknown>
      | undefined;

    if (!resolved?.config) {
      const error = resolved?.error;
      if (error) {
        console.error("Define failed:", error);
      } else {
        console.error("Define produced no output.");
      }
      return 1;
    }

    // For piping: output the resolved config as YAML to stdout when no --output
    if (!opts.output) {
      const { stringify } = await import("yaml");
      process.stdout.write(stringify(resolved.config));
    }

    return 0;
  } catch (err) {
    console.error("Define failed:", err);
    return 1;
  }
}
