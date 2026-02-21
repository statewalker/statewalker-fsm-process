import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { getConfig, setConfig } from "../adapters/config.adapter.ts";
import { type ExecutionEvent, getHistory, setHistory } from "../adapters/history.adapter.ts";
import { getParams, setParams } from "../adapters/params.adapter.ts";
import { getResolved, setResolved } from "../adapters/resolved.adapter.ts";
import type { ExecutionContext } from "./context.ts";

export interface ExecutionSnapshot {
  version: 1;
  timestamp: number;
  config: FsmStateConfig;
  params: Record<string, unknown>;
  resolved: Record<string, unknown>;
  history: unknown[];
  statePath?: string[];
}

export function dump(context: ExecutionContext): ExecutionSnapshot {
  return {
    version: 1,
    timestamp: Date.now(),
    config: getConfig(context),
    params: getParams(context),
    resolved: getResolved(context),
    history: getHistory(context),
    statePath: context["fsm:states"] as string[] | undefined,
  };
}

export function restore(snapshot: ExecutionSnapshot): {
  config: FsmStateConfig;
  context: ExecutionContext;
} {
  const context: ExecutionContext = {};
  setConfig(context, snapshot.config);
  setParams(context, snapshot.params);
  setResolved(context, snapshot.resolved);
  setHistory(context, snapshot.history as ExecutionEvent[]);
  if (snapshot.statePath) {
    context["fsm:states"] = snapshot.statePath;
  }
  return { config: snapshot.config, context };
}
