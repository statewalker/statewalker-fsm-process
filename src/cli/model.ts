import type { LanguageModelV1 } from "ai";
import type { ZodType } from "zod";
import type { GenerateObjectFn } from "../adapters/generate-object.adapter.ts";
import type { ModelRef } from "./index.ts";
import { parseModelString } from "./index.ts";

async function resolveProvider(ref: ModelRef): Promise<LanguageModelV1> {
	switch (ref.provider) {
		case "anthropic": {
			const { anthropic } = await import("@ai-sdk/anthropic");
			return anthropic(ref.modelId);
		}
		case "openai": {
			const { openai } = await import("@ai-sdk/openai");
			return openai(ref.modelId);
		}
		// case "google":
		default: {
			const { google } = await import("@ai-sdk/google");
			// Disable native structured outputs — Google's API cannot handle
			// recursive JSON schemas (e.g. states containing nested states).
			// With structuredOutputs: false the schema is sent via the prompt
			// and validated client-side by the Zod schema.
			return google(ref.modelId, { structuredOutputs: false });
		}
		// default:
		// 	throw new Error(`Unknown provider: ${ref.provider}`);
	}
}

export function resolveModel(modelStr?: string): LanguageModelV1 {
	const ref = parseModelString(modelStr);

	// Return a lazy proxy that resolves the provider on first use.
	// This avoids top-level await while still being a valid LanguageModelV1.
	let cached: LanguageModelV1 | undefined;
	const resolve = async (): Promise<LanguageModelV1> => {
		if (cached) return cached;
		cached = await resolveProvider(ref);
		return cached;
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
		const model = await resolveProvider(ref);
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
