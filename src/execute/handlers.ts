import type { StageHandler } from "@statewalker/fsm";
import type { FsmStateConfig } from "@statewalker/fsm-validator";
import type { ExecutionContext, HandlerMap } from "./context.ts";

export function findStateConfig(
  root: FsmStateConfig,
  key: string,
): FsmStateConfig | undefined {
  if (root.key === key) return root;
  if (root.states) {
    for (const child of root.states) {
      const found = findStateConfig(child, key);
      if (found) return found;
    }
  }
  return undefined;
}

function isLeafState(config: FsmStateConfig, key: string): boolean {
  const stateConfig = findStateConfig(config, key);
  return stateConfig
    ? !stateConfig.states || stateConfig.states.length === 0
    : false;
}

export function createHandlerLoader<
  C extends ExecutionContext = ExecutionContext,
>(
  config: FsmStateConfig,
  handlers: HandlerMap<C>,
  defaultHandler: StageHandler<C>,
): (state: string, event: string | undefined) => StageHandler<C>[] {
  return (state: string, _event: string | undefined): StageHandler<C>[] => {
    const explicit = handlers[state];
    if (explicit) return [explicit];
    if (isLeafState(config, state)) return [defaultHandler];
    return [];
  };
}

export function createDefaultAiHandler(): StageHandler<ExecutionContext> {
  return async function* (context) {
    const config = context.config as FsmStateConfig | undefined;
    const states = context["fsm:states"] as string[] | undefined;
    const stateKey = states?.[states.length - 1];

    if (!stateKey || !config) return;

    const stateConfig = findStateConfig(config, stateKey);
    if (!stateConfig) return;

    // Phase 1: Act — generate text artifact
    const model = context.model as import("ai").LanguageModelV1 | undefined;
    if (!model) {
      // No model — try to yield first available event
      const events = stateConfig.events;
      if (events) {
        const firstEvent = Object.keys(events)[0];
        if (firstEvent) yield firstEvent;
      }
      return;
    }

    try {
      const { generateText } = await import("ai");
      const actResult = await generateText({
        model,
        system: `You are executing state "${stateKey}" in process "${config.key}".`,
        prompt: [
          `Description: ${stateConfig.description ?? "N/A"}`,
          `Outcome: ${stateConfig.outcome ?? "N/A"}`,
          "Perform the action described above and provide your result.",
        ].join("\n"),
      });

      // Store artifact
      const history = (context.history ?? []) as Array<Record<string, unknown>>;
      history.push({
        timestamp: Date.now(),
        type: "artifact",
        statePath: [...(states ?? [])],
        data: actResult.text,
      });

      // Phase 2: Decide — choose event
      const events = stateConfig.events;
      if (!events || Object.keys(events).length === 0) return;

      const eventNames = Object.keys(events);
      if (eventNames.length === 1) {
        yield eventNames[0];
        return;
      }

      const { generateObject } = await import("ai");
      const { z } = await import("zod");
      const decideResult = await generateObject({
        model,
        schema: z.object({
          event: z.string().describe(`One of: ${eventNames.join(", ")}`),
        }),
        system: `Choose which event to emit based on the action result.`,
        prompt: [
          `Action result: ${actResult.text}`,
          `Available events: ${eventNames.map((e) => `${e}: ${events[e]}`).join("\n")}`,
        ].join("\n"),
      });

      const chosen = decideResult.object.event;
      if (eventNames.includes(chosen)) {
        yield chosen;
      } else {
        yield eventNames[0];
      }
    } catch {
      // On error, try to yield an error-like event
      const events = stateConfig.events;
      if (events) {
        const errorEvent = Object.keys(events).find((e) =>
          /fail|error|timeout/i.test(e),
        );
        if (errorEvent) yield errorEvent;
      }
    }
  };
}
