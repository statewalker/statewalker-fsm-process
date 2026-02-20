import { newAdapter } from "../adapter.ts";

export type GenerateObjectFn = (opts: {
  prompt: string;
  schema: unknown;
  system?: string;
}) => Promise<{ object: unknown }>;

export const [getGenerateObject, setGenerateObject] =
  newAdapter<GenerateObjectFn>("define:generateObject");

export const [getMaxIterations, setMaxIterations] = newAdapter<number>(
  "define:maxIterations",
  () => 5,
);
