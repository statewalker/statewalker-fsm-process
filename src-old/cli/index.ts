import { parseArgs } from "node:util";

export type CliOptions = {
  command: string;
  input?: string;
  output?: string;
  model?: string;
  params: Record<string, string>;
  format?: string;
  artifacts?: boolean;
  export?: string;
  validateOnly?: boolean;
  dryRun?: boolean;
  resume?: string;
  positional: string[];
};

export function parseCli(args: string[]): CliOptions {
  const { values, positionals } = parseArgs({
    args,
    options: {
      input: { type: "string", short: "i" },
      output: { type: "string", short: "o" },
      model: { type: "string", short: "m" },
      param: { type: "string", multiple: true, short: "p" },
      format: { type: "string", short: "f" },
      artifacts: { type: "boolean" },
      export: { type: "string" },
      "validate-only": { type: "boolean" },
      "dry-run": { type: "boolean" },
      resume: { type: "string" },
    },
    allowPositionals: true,
    strict: true,
  });

  const command = positionals[0] ?? "";
  const positional = positionals.slice(1);

  const params: Record<string, string> = {};
  if (values.param) {
    for (const p of values.param) {
      const eq = p.indexOf("=");
      if (eq > 0) {
        params[p.slice(0, eq)] = p.slice(eq + 1);
      }
    }
  }

  return {
    command,
    input: values.input,
    output: values.output,
    model: values.model,
    params,
    format: values.format,
    artifacts: values.artifacts,
    export: values.export,
    validateOnly: values["validate-only"],
    dryRun: values["dry-run"],
    resume: values.resume,
    positional,
  };
}

export type ModelRef = {
  provider: string;
  modelId: string;
};

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o",
  google: "gemini-2.5-flash",
};

export function parseModelString(model?: string): ModelRef {
  if (!model) {
    return { provider: "google", modelId: DEFAULT_MODELS.google };
  }
  const colon = model.indexOf(":");
  if (colon > 0) {
    return {
      provider: model.slice(0, colon),
      modelId: model.slice(colon + 1),
    };
  }
  // If the string matches a known provider name, use it as provider with its default model
  if (model in DEFAULT_MODELS) {
    return { provider: model, modelId: DEFAULT_MODELS[model] };
  }
  // Otherwise treat as an Anthropic model ID
  return { provider: "anthropic", modelId: model };
}

export async function run(args: string[]): Promise<number> {
  const opts = parseCli(args);

  switch (opts.command) {
    case "define": {
      const { runDefineCommand } = await import("./define.ts");
      return runDefineCommand(opts);
    }
    case "execute": {
      const { runExecuteCommand } = await import("./execute.ts");
      return runExecuteCommand(opts);
    }
    case "trace": {
      const { runTraceCommand } = await import("./trace.ts");
      return runTraceCommand(opts);
    }
    default:
      console.error(
        `Unknown command: ${opts.command || "(none)"}\nUsage: fsm-process <define|execute|trace> [options]`,
      );
      return 2;
  }
}
