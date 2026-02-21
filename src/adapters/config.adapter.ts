import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { newAdapter } from "./new-adapter.ts";

export const [getConfig, setConfig] = newAdapter<FsmStateConfig>("config");
