import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { describe, expect, it } from "vitest";
import { setLogger } from "@/shared/logger/index.ts";
import { setConfig } from "@/shared-process/adapters/config.adapter.ts";
import { getEvents } from "@/shared-process/adapters/fsm.adapter";
import { createHandlerLoader } from "@/shared-process/run-process/handler-loader.ts";
import { runProcess } from "@/shared-process/run-process/run-process.ts";

const toggleConfig: FsmStateConfig = {
  key: "Toggle",
  transitions: [
    ["", "*", "Off"],
    ["Off", "flip", "On"],
    ["On", "flip", "Off"],
    ["Off", "stop", ""],
  ],
  states: [
    { key: "Off", events: { flip: "turn on", stop: "halt" } },
    { key: "On", events: { flip: "turn off" } },
  ],
};

async function* eventBridge(
  context: Record<string, unknown>,
): AsyncGenerator<string> {
  const events = getEvents(context);
  yield* events.readEvents();
}

describe("integration: handler emits -> event bridge yields -> FSM transitions", () => {
  it("handler emits events that drive FSM through states", async () => {
    const visited: string[] = [];
    const ctx: Record<string, unknown> = {};
    const events = getEvents(ctx);
    setConfig(ctx, toggleConfig);
    setLogger(ctx, {
      level: "info",
      fatal: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
      trace: () => {},
      child() {
        return this;
      },
    });

    // Track which leaf states were visited via a handler that emits events
    const leafHandler = (context: Record<string, unknown>) => {
      const stack = context["fsm:states"] as string[];
      const state = stack[stack.length - 1];
      visited.push(state);

      if (state === "Off" && visited.length === 1) {
        events.emit("flip");
      } else if (state === "On") {
        events.emit("flip");
      } else {
        // second Off -> stop
        events.emit("stop");
      }
    };

    const load = createHandlerLoader(
      toggleConfig,
      { Toggle: [eventBridge] },
      leafHandler,
    );

    const { done } = await runProcess({
      config: toggleConfig,
      context: ctx,
      load,
    });
    await done;

    expect(visited).toEqual(["Off", "On", "Off"]);
  });
});
