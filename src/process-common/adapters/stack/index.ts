import { newAdapter } from "../../../commons/adapters/index.ts";

export const [getStack] = newAdapter<string[]>("fsm:states", () => []);
