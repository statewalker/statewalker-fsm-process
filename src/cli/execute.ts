import { readFile } from "node:fs/promises";
import { restore } from "../execute/dump.ts";
import { instantiate } from "../execute/instantiate.ts";
import { run } from "../execute/runner.ts";
import { Tracer } from "../observe/tracer.ts";
import type { CliOptions } from "./index.ts";
import { resolveModel } from "./model.ts";
import { readStdin } from "./pipe.ts";

export async function runExecuteCommand(opts: CliOptions): Promise<number> {
  try {
    // --resume: restore from snapshot
    if (opts.resume) {
      const raw = await readFile(opts.resume, "utf-8");
      const snapshot = JSON.parse(raw);
      const { config, context } = restore(snapshot);

      context.model = resolveModel(opts.model);

      const tracer = new Tracer();
      const { done } = await run({
        config,
        context,
        handlers: {},
        tracer,
      });

      await done;
      outputTrace(tracer);
      return 0;
    }

    // Normal execution: require template path or stdin
    const templatePath = opts.positional[0];
    if (!templatePath) {
      // Support piping: read YAML from stdin
      const stdinData = await readStdin();
      if (stdinData) {
        // Parse YAML from stdin, use it as inline config
        const { parse } = await import("yaml");
        const config = parse(stdinData);
        const model = resolveModel(opts.model);

        if (opts.dryRun) {
          console.error("Dry run: config validated successfully");
          const { stringify } = await import("yaml");
          process.stdout.write(stringify(config));
          return 0;
        }

        const { config: validatedConfig, context } = await instantiate({
          template: config,
          params: opts.params,
          model,
        });

        const tracer = new Tracer();
        const { done } = await run({
          config: validatedConfig,
          context,
          handlers: {},
          tracer,
        });

        await done;
        outputTrace(tracer);
        return 0;
      }

      console.error(
        "Usage: fsm-process execute <template.yaml> [--param key=value] [--model provider:model] [--dry-run] [--resume snapshot.json]",
      );
      return 2;
    }

    const model = resolveModel(opts.model);
    const { config, context } = await instantiate({
      template: templatePath,
      params: opts.params,
      model,
    });

    if (opts.dryRun) {
      console.error("Dry run: config validated successfully");
      const { stringify } = await import("yaml");
      process.stdout.write(stringify(config));
      return 0;
    }

    const tracer = new Tracer();
    const { done } = await run({
      config,
      context,
      handlers: {},
      tracer,
    });

    await done;
    outputTrace(tracer);
    return 0;
  } catch (err) {
    console.error("Execute failed:", err);
    return 1;
  }
}

function outputTrace(tracer: Tracer): void {
  const entries = tracer.toJSON();
  if (entries.length > 0) {
    process.stdout.write(JSON.stringify({ trace: entries }, null, 2));
  }
}
