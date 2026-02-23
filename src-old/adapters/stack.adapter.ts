import { newAdapter } from "./new-adapter.ts";

export const [getStack] = newAdapter<string[]>("fsm:states", () => []);
