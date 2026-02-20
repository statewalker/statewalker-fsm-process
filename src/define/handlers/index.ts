import type { StageHandler } from "@statewalker/fsm";
import { generateInitialConfigHandler } from "./generate-initial-config.ts";
import { getUserInputHandler } from "./get-user-input.ts";
import { refineProcessConfigHandler } from "./refine-process-config.ts";
import { serializeConfigHandler } from "./serialize-config.ts";
import { validateProcessConfigHandler } from "./validate-process-config.ts";

const handlers: Record<string, StageHandler<Record<string, unknown>>> = {
  GetUserInput: getUserInputHandler,
  GenerateInitialConfig: generateInitialConfigHandler,
  ValidateProcessConfig: validateProcessConfigHandler,
  RefineProcessConfig: refineProcessConfigHandler,
  SerializeConfig: serializeConfigHandler,
};

export function load(
  state: string,
  _event: undefined | string,
): StageHandler<Record<string, unknown>>[] {
  const handler = handlers[state];
  return handler ? [handler] : [];
}
