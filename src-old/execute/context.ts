import type { StageHandler } from "@statewalker/fsm";

export type ExecutionContext = Record<string, unknown>;

export type HandlerMap<C extends ExecutionContext = ExecutionContext> = Record<
  string,
  StageHandler<C>
>;
