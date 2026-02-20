import type { LanguageModelV1 } from "ai";
import type { ZodType } from "zod";
import type { GenerateObjectFn } from "../define/context.ts";
import { parseModelString } from "./index.ts";

export function resolveModel(modelStr?: string): LanguageModelV1 | undefined {
  if (!modelStr) return undefined;

  const ref = parseModelString(modelStr);

  // Return a lazy proxy that resolves the provider on first use.
  // This avoids top-level await while still being a valid LanguageModelV1.
  let cached: LanguageModelV1 | undefined;
  const resolve = async (): Promise<LanguageModelV1> => {
    if (cached) return cached;
    switch (ref.provider) {
      case "anthropic": {
        const { anthropic } = await import("@ai-sdk/anthropic");
        cached = anthropic(ref.modelId);
        break;
      }
      case "openai": {
        const { openai } = await import("@ai-sdk/openai");
        cached = openai(ref.modelId);
        break;
      }
      case "google": {
        const { google } = await import("@ai-sdk/google");
        cached = google(ref.modelId);
        break;
      }
      default:
        throw new Error(`Unknown provider: ${ref.provider}`);
    }
    return cached as LanguageModelV1;
  };

  // Create a thin wrapper that conforms to LanguageModelV1 interface.
  // The actual provider is resolved lazily on first doGenerate / doStream call.
  return {
    specificationVersion: "v1",
    provider: ref.provider,
    modelId: ref.modelId,
    defaultObjectGenerationMode: "json",
    async doGenerate(params) {
      const m = await resolve();
      return m.doGenerate(params);
    },
    async doStream(params) {
      const m = await resolve();
      return m.doStream(params);
    },
  } as LanguageModelV1;
}

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
