import type { StageHandler } from "@statewalker/fsm";
import { prompts } from "@statewalker/fsm-validator";
import { getGenerateObject } from "../../adapters/generate-object.adapter.ts";
import { getLogger } from "../../adapters/logger.adapter.ts";
import { getResolved } from "../../adapters/resolved.adapter.ts";
import { fsmStateConfigSchema } from "../schema.ts";

export const generateInitialConfigHandler: StageHandler<
  Record<string, unknown>
> = async function* (context) {
  const resolved = getResolved(context);
  const generateObject = getGenerateObject(context);
  const logger = getLogger(context);
  try {
    const result = await generateObject({
      system: prompts.generation,
      prompt: resolved.description as string,
      schema: fsmStateConfigSchema,
    });

    resolved.config = result.object;
    resolved.iteration = 0;
    logger.debug(
      "Initial configuration generated:",
      JSON.stringify(resolved.config, null, 2),
    );
    yield "configGenerated";
  } catch (err) {
    console.error("AI generation failed:", err);
    resolved.error = err;
    yield "generationFailed";
  }
};
