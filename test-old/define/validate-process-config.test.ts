import { setGenerateObject } from "../../src/adapters/generate-object.adapter.ts";
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

  it("should run semantic validation even when structural errors exist", async () => {
    const ctx = createDefineContext({
      resolved: { config: brokenConfig },
    });
    let aiCalled = false;
    setGenerateObject(ctx, async () => {
      aiCalled = true;
      return { object: { incoherencies: [] } };
    });

    await collectEvents(validateProcessConfigHandler, ctx);
    expect(aiCalled).toBe(true);
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
              type: "goal_misalignment",
              description: "Goal misalignment detected",
              statePath: "LightBulb.Off",
              rule: "M9",
              suggestion: "Align child goal with parent",
            },
          ],
        },
      ]),
    );

    const { events } = await collectEvents(validateProcessConfigHandler, ctx);
    expect(events).toEqual(["validationFailed"]);
    const resolved = ctx.resolved as Record<string, unknown>;
    const issues = resolved.semanticIssues as Array<Record<string, string>>;
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("goal_misalignment");
    expect(issues[0].suggestion).toBe("Align child goal with parent");
  });

  it("should produce structured YAML allIssues", async () => {
    const ctx = createDefineContext({
      resolved: { config: lightBulbConfig },
    });
    setGenerateObject(
      ctx,
      mockGenerateObject([
        {
          incoherencies: [
            {
              type: "event_state_inconsistency",
              description: "Event does not match state purpose",
              statePath: "LightBulb.On",
              rule: "M8",
              suggestion: "Rename event to match state semantics",
            },
          ],
        },
      ]),
    );

    await collectEvents(validateProcessConfigHandler, ctx);
    const resolved = ctx.resolved as Record<string, unknown>;
    const allIssues = resolved.allIssues as string;
    expect(allIssues).toContain("semantic_incoherencies");
    expect(allIssues).toContain("M8");
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
