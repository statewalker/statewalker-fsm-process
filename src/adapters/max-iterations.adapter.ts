import { newAdapter } from "./new-adapter.ts";

export const [getMaxIterations, setMaxIterations] = newAdapter<number>(
	"define:maxIterations",
	() => 5,
);
