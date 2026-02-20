import type { StageHandler } from "@statewalker/fsm";
import { prompts } from "@statewalker/fsm-validator";
import { stringify } from "yaml";
import { newAdapter } from "../../adapter.ts";
import { getGenerateObject, getMaxIterations } from "../context.ts";
import { fsmStateConfigSchema } from "../schema.ts";

const [getResolved] = newAdapter<Record<string, unknown>>(
  "resolved",
  () => ({}),
);

export const refineProcessConfigHandler: StageHandler<Record<string, unknown>> =
  async function* (context) {
    const resolved = getResolved(context);
    const maxIterations = getMaxIterations(context);
    const iteration = ((resolved.iteration as number) ?? 0) + 1;
    resolved.iteration = iteration;

    if (iteration > maxIterations) {
      yield "generationFailed";
      return;
    }

    const generateObject = getGenerateObject(context);
    const configYaml = stringify(resolved.config);
    const allIssues = resolved.allIssues as string;

    try {
      const result = await generateObject({
        system: prompts.refinement,
        prompt: [
          "# Current Configuration",
          "```yaml",
          configYaml,
          "```",
          "",
          "# Validation Issues to Fix",
          allIssues,
          "",
          "Fix all reported issues while preserving the overall process structure and semantics.",
          "Return the complete refined configuration.",
        ].join("\n"),
        schema: fsmStateConfigSchema,
      });
      resolved.config = result.object;
      yield "configRefined";
    } catch (err) {
      resolved.error = err;
      yield "generationFailed";
    }
  };
