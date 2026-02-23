import type { StageHandler } from "@statewalker/fsm";
import { getLogger, type LoggerLevel } from "@/shared/logger/logger.js";
import { getFsmEvent, getFsmStack } from "@/shared-process/adapters";

export function newStateTracer(
  level: LoggerLevel = "info",
): StageHandler<Record<string, unknown>> {
  // let stateCounter = 0;
  return async (context: Record<string, unknown>) => {
    // const stateId = stateCounter++; // String(stateCounter++).padStart(5, "0");
    const logger = getLogger(context);
    const stack = getFsmStack(context);
    const event = getFsmEvent(context);
    const path = stack.map(() => " ").join("");
    const state = stack[stack.length - 1] || "";
    logger[level](`${path}<${state} event="${event}">`);
    return () => {
      const logger = getLogger(context);
      logger[level](`${path}</${state}>`);
    };
  };
}
