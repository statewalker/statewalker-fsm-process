import { newAdapter } from "./new-adapter.ts";

export type GenerateObjectFn = (opts: {
	prompt: string;
	schema: unknown;
	system?: string;
}) => Promise<{ object: unknown }>;

export const [getGenerateObject, setGenerateObject] =
	newAdapter<GenerateObjectFn>("define:generateObject");
