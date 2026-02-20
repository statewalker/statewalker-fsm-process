import {
  setConfig,
  setHistory,
  setParams,
  setResolved,
} from "../../src/execute/context.ts";
import { dump, restore } from "../../src/execute/dump.ts";
import { describe, expect, it } from "../deps.ts";
import { lightBulbConfig } from "../fixtures.ts";

describe("dump", () => {
  it("should serialize context to a snapshot", () => {
    const ctx: Record<string, unknown> = {};
    setConfig(ctx, lightBulbConfig);
    setParams(ctx, { project: "./test" });
    setResolved(ctx, { step: "done" });
    setHistory(ctx, []);
    ctx["fsm:states"] = ["LightBulb", "Off"];

    const snapshot = dump(ctx);

    expect(snapshot.version).toBe(1);
    expect(snapshot.config.key).toBe("LightBulb");
    expect(snapshot.params).toEqual({ project: "./test" });
    expect(snapshot.resolved).toEqual({ step: "done" });
    expect(snapshot.statePath).toEqual(["LightBulb", "Off"]);
    expect(snapshot.timestamp).toBeGreaterThan(0);
  });
});

describe("restore", () => {
  it("should restore context from a snapshot", () => {
    const snapshot = {
      version: 1 as const,
      timestamp: Date.now(),
      config: lightBulbConfig,
      params: { project: "./" },
      resolved: { key: "value" },
      history: [{ type: "enter", stateKey: "Off" }],
      statePath: ["LightBulb", "Off"],
    };

    const { config, context } = restore(snapshot);

    expect(config.key).toBe("LightBulb");
    expect(context.config).toBe(config);
    expect(context.params).toEqual({ project: "./" });
    expect(context.resolved).toEqual({ key: "value" });
    expect(context.history).toHaveLength(1);
    expect(context["fsm:states"]).toEqual(["LightBulb", "Off"]);
  });

  it("should handle snapshot without statePath", () => {
    const snapshot = {
      version: 1 as const,
      timestamp: Date.now(),
      config: lightBulbConfig,
      params: {},
      resolved: {},
      history: [],
    };

    const { context } = restore(snapshot);
    expect(context["fsm:states"]).toBeUndefined();
  });
});
