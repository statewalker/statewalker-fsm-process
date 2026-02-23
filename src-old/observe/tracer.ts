import type { StageHandler } from "@statewalker/fsm";
import type { ExecutionEvent } from "../adapters/history.adapter.ts";
import { toChartData } from "./bridge.ts";

export interface TraceEntry extends ExecutionEvent {
  depth: number;
  stateKey: string;
  duration?: number;
}

export interface ChartEvent {
  type: "activate" | "deactivate";
  timestamp: number;
  stateIds: string[];
}

export class Tracer {
  private entries: TraceEntry[] = [];
  private activeStates: Map<string, { timestamp: number; depth: number }> =
    new Map();

  asHandler<
    C extends Record<string, unknown> = Record<string, unknown>,
  >(): StageHandler<C> {
    return (context: C) => {
      const states = context["fsm:states"] as string[] | undefined;
      if (!states || states.length === 0) return;

      const statePath = [...states];
      const stateKey = statePath[statePath.length - 1];
      const depth = statePath.length - 1;
      const enterTime = Date.now();

      this.entries.push({
        timestamp: enterTime,
        depth,
        type: "enter",
        statePath,
        stateKey,
      });

      this.activeStates.set(stateKey, { timestamp: enterTime, depth });

      return () => {
        const exitTime = Date.now();
        const enterInfo = this.activeStates.get(stateKey);
        const duration = enterInfo ? exitTime - enterInfo.timestamp : 0;

        this.entries.push({
          timestamp: exitTime,
          depth,
          type: "exit",
          statePath,
          stateKey,
          duration,
        });

        this.activeStates.delete(stateKey);
      };
    };
  }

  dispatch(event: string, statePath: string[]): void {
    const stateKey = statePath[statePath.length - 1] ?? "";
    this.entries.push({
      timestamp: Date.now(),
      depth: statePath.length - 1,
      type: "dispatch",
      statePath: [...statePath],
      stateKey,
      event,
    });
  }

  artifact(statePath: string[], data: unknown): void {
    const stateKey = statePath[statePath.length - 1] ?? "";
    this.entries.push({
      timestamp: Date.now(),
      depth: statePath.length - 1,
      type: "artifact",
      statePath: [...statePath],
      stateKey,
      data,
    });
  }

  error(statePath: string[], err: Error): void {
    const stateKey = statePath[statePath.length - 1] ?? "";
    this.entries.push({
      timestamp: Date.now(),
      depth: statePath.length - 1,
      type: "error",
      statePath: [...statePath],
      stateKey,
      data: { message: err.message, name: err.name },
    });
  }

  toJSON(): TraceEntry[] {
    return [...this.entries];
  }

  toChartEvents(): ChartEvent[] {
    return toChartData(this.entries);
  }
}
