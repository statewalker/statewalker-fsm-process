import type { FsmStateConfig } from "@statewalker/fsm-validator";
import {
  createDefaultAiHandler,
  createHandlerLoader,
  findStateConfig,
} from "../../src/execute/handlers.ts";
import { describe, expect, it } from "../deps.ts";
import { lightBulbConfig } from "../fixtures.ts";
import { collectEvents, createExecutionContext } from "../helpers.ts";

describe("findStateConfig", () => {
  it("should find root config by key", () => {
    const found = findStateConfig(lightBulbConfig, "LightBulb");
    expect(found).toBe(lightBulbConfig);
  });

  it("should find child config by key", () => {
    const found = findStateConfig(lightBulbConfig, "Off");
    expect(found?.key).toBe("Off");
  });

  it("should return undefined for unknown key", () => {
    const found = findStateConfig(lightBulbConfig, "Unknown");
    expect(found).toBeUndefined();
  });
});

describe("createHandlerLoader", () => {
  it("should return explicit handler when registered", () => {
    const myHandler = async function* () {
      yield "custom";
    };
    const loader = createHandlerLoader(
      lightBulbConfig,
      { Off: myHandler },
      async function* () {
        yield "default";
      },
    );

    const handlers = loader("Off", undefined);
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBe(myHandler);
  });

  it("should return default handler for unregistered leaf states", () => {
    const defaultHandler = async function* () {
      yield "default";
    };
    const loader = createHandlerLoader(lightBulbConfig, {}, defaultHandler);

    const handlers = loader("On", undefined);
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBe(defaultHandler);
  });

  it("should return empty array for non-leaf states without explicit handler", () => {
    const configWithNesting: FsmStateConfig = {
      key: "Root",
      transitions: [["", "*", "Parent"]],
      states: [
        {
          key: "Parent",
          transitions: [["", "*", "Child"]],
          states: [{ key: "Child", events: { done: "finished" } }],
          events: { done: "parent done" },
        },
      ],
    };

    const loader = createHandlerLoader(
      configWithNesting,
      {},
      async function* () {
        yield "default";
      },
    );

    const handlers = loader("Parent", undefined);
    expect(handlers).toHaveLength(0);
  });
});

describe("createDefaultAiHandler", () => {
  it("should yield first event when no model is available", async () => {
    const handler = createDefaultAiHandler();
    const ctx = createExecutionContext();
    ctx.config = lightBulbConfig;
    ctx["fsm:states"] = ["LightBulb", "Off"];

    const { events } = await collectEvents(handler, ctx);
    expect(events).toEqual(["toggle"]);
  });

  it("should return nothing when state has no events and no model", async () => {
    const configNoEvents: FsmStateConfig = {
      key: "Root",
      transitions: [["", "*", "Leaf"]],
      states: [{ key: "Leaf", description: "no events here" }],
    };

    const handler = createDefaultAiHandler();
    const ctx = createExecutionContext();
    ctx.config = configNoEvents;
    ctx["fsm:states"] = ["Root", "Leaf"];

    const { events } = await collectEvents(handler, ctx);
    expect(events).toEqual([]);
  });

  it("should return nothing when context has no state path", async () => {
    const handler = createDefaultAiHandler();
    const ctx = createExecutionContext();
    ctx.config = lightBulbConfig;

    const { events } = await collectEvents(handler, ctx);
    expect(events).toEqual([]);
  });
});
