import type { FsmStateConfig } from "@statewalker/fsm-validator";
import type { ExecutionContext } from "./context.ts";
import { getConfig, getHistory, getParams, getResolved } from "./context.ts";

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
  context.config = snapshot.config;
  context.params = snapshot.params;
  context.resolved = snapshot.resolved;
  context.history = snapshot.history;
  if (snapshot.statePath) {
    context["fsm:states"] = snapshot.statePath;
  }
  return { config: snapshot.config, context };
}
