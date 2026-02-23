import { newAdapter } from "@/shared/adapters/index.ts";

export const [getStack] = newAdapter<string[]>("fsm:states", () => []);
