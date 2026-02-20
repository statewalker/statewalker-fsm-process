import { z } from "zod";

const fsmTransition = z.tuple([z.string(), z.string(), z.string()]);

export const fsmStateConfigSchema: z.ZodType = z.lazy(() =>
  z.object({
    key: z.string().describe("PascalCase state identifier"),
    name: z.string().optional().describe("Human-readable display name"),
    description: z.string().optional().describe("Purpose and behavior"),
    outcome: z.string().optional().describe("Expected result upon completion"),
    events: z
      .record(z.string(), z.string())
      .optional()
      .describe("Event name to description map"),
    transitions: z
      .array(fsmTransition)
      .optional()
      .describe("[from, event, to] tuples"),
    states: z
      .array(fsmStateConfigSchema)
      .optional()
      .describe("Nested sub-states"),
    actors: z.array(z.string()).optional().describe("Participating entities"),
    object: z.string().optional().describe("Primary entity acted upon"),
  }),
);
