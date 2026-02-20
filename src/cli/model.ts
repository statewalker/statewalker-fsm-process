import type { LanguageModelV1 } from "ai";
import type { ZodType } from "zod";
import type { GenerateObjectFn } from "../define/context.ts";
import { parseModelString } from "./index.ts";

export function resolveGenerateObject(modelStr?: string): GenerateObjectFn {
  const ref = parseModelString(modelStr);

  return async (opts) => {
    let model: LanguageModelV1;

    switch (ref.provider) {
      case "anthropic": {
        const { anthropic } = await import("@ai-sdk/anthropic");
        model = anthropic(ref.modelId);
        break;
      }
      case "openai": {
        const { openai } = await import("@ai-sdk/openai");
        model = openai(ref.modelId);
        break;
      }
      case "google": {
        const { google } = await import("@ai-sdk/google");
        model = google(ref.modelId);
        break;
      }
      default:
        throw new Error(`Unknown provider: ${ref.provider}`);
    }

    const { generateObject } = await import("ai");
    const result = await generateObject({
      model,
      schema: opts.schema as ZodType,
      system: opts.system,
      prompt: opts.prompt,
    });

    return { object: result.object };
  };
}
