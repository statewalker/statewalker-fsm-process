import type { StageHandler } from "@statewalker/fsm";
import { prompts } from "@statewalker/fsm-validator";
import { newAdapter } from "../../adapter.ts";
import { getGenerateObject } from "../context.ts";
import { fsmStateConfigSchema } from "../schema.ts";

const [getResolved] = newAdapter<Record<string, unknown>>(
  "resolved",
  () => ({}),
);

export const generateInitialConfigHandler: StageHandler<
  Record<string, unknown>
> = async function* (context) {
  const resolved = getResolved(context);
  const generateObject = getGenerateObject(context);

  try {
    const result = await generateObject({
      system: prompts.generation,
      prompt: resolved.description as string,
      schema: fsmStateConfigSchema,
    });
    resolved.config = result.object;
    resolved.iteration = 0;
    yield "configGenerated";
  } catch (err) {
    resolved.error = err;
    yield "generationFailed";
  }
};
