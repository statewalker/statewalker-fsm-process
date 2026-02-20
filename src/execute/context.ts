import type { LanguageModelV1 } from "ai";
import { newAdapter } from "../adapter.ts";

export type ExecutionContext = Record<string, unknown>;

export type ExecutionEvent = {
  timestamp: number;
  type: "enter" | "exit" | "dispatch" | "error";
  statePath: string[];
  event?: string;
  data?: unknown;
};

export type HandlerMap<C extends ExecutionContext = ExecutionContext> = Record<
  string,
  import("@statewalker/fsm").StageHandler<C>
>;

export const [getConfig, setConfig] =
  newAdapter<import("@statewalker/fsm-validator").FsmStateConfig>("config");

export const [getModel, setModel] = newAdapter<LanguageModelV1>("model");

export const [getParams, setParams] = newAdapter<Record<string, unknown>>(
  "params",
  () => ({}),
);

export const [getResolved, setResolved] = newAdapter<Record<string, unknown>>(
  "resolved",
  () => ({}),
);

export const [getHistory, setHistory] = newAdapter<ExecutionEvent[]>(
  "history",
  () => [],
);
