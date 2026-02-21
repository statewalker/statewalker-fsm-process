import { setGenerateObject } from "../../src/adapters/generate-object.adapter.ts";
import { setMaxIterations } from "../../src/adapters/max-iterations.adapter.ts";
import { refineProcessConfigHandler } from "../../src/define/handlers/refine-process-config.ts";
import { describe, expect, it } from "../deps.ts";
import { lightBulbConfig } from "../fixtures.ts";
import {
  collectEvents,
  createDefineContext,
  mockGenerateObject,
} from "../helpers.ts";

describe("refineProcessConfigHandler", () => {
  it("should refine config and yield configRefined", async () => {
    const refined = { ...lightBulbConfig, key: "RefinedBulb" };
    const ctx = createDefineContext({
      resolved: {
        config: lightBulbConfig,
        allIssues: "Some issues",
        iteration: 0,
      },
    });
    setGenerateObject(ctx, mockGenerateObject([refined]));

    const { events } = await collectEvents(refineProcessConfigHandler, ctx);
    expect(events).toEqual(["configRefined"]);
    const resolved = ctx.resolved as Record<string, unknown>;
    expect((resolved.config as Record<string, unknown>).key).toBe(
      "RefinedBulb",
    );
    expect(resolved.iteration).toBe(1);
  });

  it("should yield generationFailed when max iterations exceeded", async () => {
    const ctx = createDefineContext({
      resolved: {
        config: lightBulbConfig,
        allIssues: "Issues",
        iteration: 5,
      },
    });
    setMaxIterations(ctx, 5);
    setGenerateObject(ctx, mockGenerateObject([lightBulbConfig]));

    const { events } = await collectEvents(refineProcessConfigHandler, ctx);
    expect(events).toEqual(["generationFailed"]);
  });

  it("should yield generationFailed on AI error", async () => {
    const ctx = createDefineContext({
      resolved: {
        config: lightBulbConfig,
        allIssues: "Issues",
        iteration: 0,
      },
    });
    setGenerateObject(ctx, async () => {
      throw new Error("Network error");
    });

    const { events } = await collectEvents(refineProcessConfigHandler, ctx);
    expect(events).toEqual(["generationFailed"]);
  });
});
