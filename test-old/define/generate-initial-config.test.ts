import { setGenerateObject } from "../../src/adapters/generate-object.adapter.ts";
import { generateInitialConfigHandler } from "../../src/define/handlers/generate-initial-config.ts";
import { describe, expect, it } from "../deps.ts";
import { lightBulbConfig } from "../fixtures.ts";
import {
  collectEvents,
  createDefineContext,
  mockGenerateObject,
} from "../helpers.ts";

describe("generateInitialConfigHandler", () => {
  it("should generate config and yield configGenerated", async () => {
    const ctx = createDefineContext({
      resolved: { description: "A light bulb" },
    });
    setGenerateObject(ctx, mockGenerateObject([lightBulbConfig]));

    const { events } = await collectEvents(generateInitialConfigHandler, ctx);
    expect(events).toEqual(["configGenerated"]);
    const resolved = ctx.resolved as Record<string, unknown>;
    expect(resolved.config).toEqual(lightBulbConfig);
    expect(resolved.iteration).toBe(0);
  });

  it("should yield generationFailed on AI error", async () => {
    const ctx = createDefineContext({
      resolved: { description: "A workflow" },
    });
    setGenerateObject(ctx, async () => {
      throw new Error("API error");
    });

    const { events } = await collectEvents(generateInitialConfigHandler, ctx);
    expect(events).toEqual(["generationFailed"]);
    expect((ctx.resolved as Record<string, unknown>).error).toBeInstanceOf(
      Error,
    );
  });
});
