import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { newAdapter } from "@/shared/adapters/index.ts";

export type { FsmStateConfig };

export const [getConfig, setConfig] = newAdapter<FsmStateConfig>("config");
