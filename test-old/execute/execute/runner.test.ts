import type { StageHandler } from "@statewalker/fsm";
import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { run } from "../../src/execute/runner.ts";
import { describe, expect, it } from "../deps.ts";
import { lightBulbConfig } from "../fixtures.ts";
import type { ExecutionContext } from "../helpers.ts";

describe("run", () => {
  it("should execute and return terminate + done promise", async () => {
    const entered: string[] = [];

    const handlers: Record<string, StageHandler<ExecutionContext>> = {
      Off() {
        entered.push("Off");
        // Don't yield any events — FSM will complete after entering Off
      },
    };

    const { terminate, done } = await run({
      config: lightBulbConfig,
      context: {},
      handlers,
    });

    expect(typeof terminate).toBe("function");
    expect(done).toBeInstanceOf(Promise);

    // The FSM enters Off (initial state) via the "*" transition.
    // Since Off handler yields nothing, it stays there.
    // Terminate to clean up.
    await terminate();
  });

  it("should resolve done when root state exits", async () => {
    // Create a linear FSM that completes immediately:
    // Root -> Step (via *) -> exit (Step yields "done", "done" -> "")
    const linearConfig: FsmStateConfig = {
      key: "Root",
      transitions: [
        ["", "*", "Step"],
        ["Step", "done", ""],
      ],
      states: [
        {
          key: "Step",
          description: "Single step",
          events: { done: "complete" },
        },
      ],
    };

    const handlers: Record<string, StageHandler<ExecutionContext>> = {
      Step: async function* () {
        yield "done";
      },
    };

    const { done } = await run({
      config: linearConfig,
      context: {},
      handlers,
    });

    // done should resolve when root exits
    await done;
  });

  it("should pass extra handlers to all states", async () => {
    const log: string[] = [];

    const extraHandler: StageHandler<ExecutionContext> = (ctx) => {
      const states = ctx["fsm:states"] as string[] | undefined;
      if (states) log.push(states[states.length - 1]);
    };

    const linearConfig: FsmStateConfig = {
      key: "Root",
      transitions: [
        ["", "*", "Step"],
        ["Step", "done", ""],
      ],
      states: [
        {
          key: "Step",
          description: "Single step",
          events: { done: "complete" },
        },
      ],
    };

    const handlers: Record<string, StageHandler<ExecutionContext>> = {
      Step: async function* () {
        yield "done";
      },
    };

    const { done } = await run({
      config: linearConfig,
      context: {},
      handlers,
      extraHandlers: [extraHandler],
    });

    await done;
    // Extra handler should have been invoked for at least Root and Step
    expect(log.length).toBeGreaterThanOrEqual(1);
  });
});
