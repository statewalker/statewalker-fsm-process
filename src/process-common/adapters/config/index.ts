import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { newAdapter } from "../../../commons/adapters/index.ts";

export type { FsmStateConfig };

export const [getConfig, setConfig] = newAdapter<FsmStateConfig>("config");
