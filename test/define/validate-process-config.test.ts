import { setGenerateObject } from "../../src/define/context.ts";
import { validateProcessConfigHandler } from "../../src/define/handlers/validate-process-config.ts";
import { describe, expect, it } from "../deps.ts";
import { brokenConfig, lightBulbConfig } from "../fixtures.ts";
import {
  collectEvents,
  createDefineContext,
  mockGenerateObject,
} from "../helpers.ts";

describe("validateProcessConfigHandler", () => {
  it("should yield configValid for valid config with no semantic issues", async () => {
    const ctx = createDefineContext({
      resolved: { config: lightBulbConfig },
    });
    setGenerateObject(ctx, mockGenerateObject([{ incoherencies: [] }]));

    const { events } = await collectEvents(validateProcessConfigHandler, ctx);
    expect(events).toEqual(["configValid"]);
  });

  it("should yield validationFailed for structurally broken config", async () => {
    const ctx = createDefineContext({
      resolved: { config: brokenConfig },
    });
    setGenerateObject(ctx, mockGenerateObject([{ incoherencies: [] }]));

    const { events } = await collectEvents(validateProcessConfigHandler, ctx);
    expect(events).toEqual(["validationFailed"]);
    expect((ctx.resolved as Record<string, unknown>).allIssues).toBeTruthy();
  });

  it("should yield validationFailed when AI finds semantic issues", async () => {
    const ctx = createDefineContext({
      resolved: { config: lightBulbConfig },
    });
    setGenerateObject(
      ctx,
      mockGenerateObject([
        {
          incoherencies: [
            {
              rule: "M9",
              statePath: "LightBulb.Off",
              issue: "Goal misalignment",
            },
          ],
        },
      ]),
    );

    const { events } = await collectEvents(validateProcessConfigHandler, ctx);
    expect(events).toEqual(["validationFailed"]);
    const resolved = ctx.resolved as Record<string, unknown>;
    expect(resolved.semanticIssues).toHaveLength(1);
  });

  it("should still yield configValid if AI call fails but structural is clean", async () => {
    const ctx = createDefineContext({
      resolved: { config: lightBulbConfig },
    });
    setGenerateObject(ctx, async () => {
      throw new Error("AI unavailable");
    });

    const { events } = await collectEvents(validateProcessConfigHandler, ctx);
    expect(events).toEqual(["configValid"]);
  });
});
