import { getUserInputHandler } from "../../src/define/handlers/get-user-input.ts";
import { describe, expect, it } from "../deps.ts";
import {
  collectEvents,
  createDefineContext,
  writeTempFile,
} from "../helpers.ts";

describe("getUserInputHandler", () => {
  it("should read from file and yield inputReady", async () => {
    const { path, cleanup } = await writeTempFile("Build a workflow");
    try {
      const ctx = createDefineContext({ params: { input: path } });
      const { events } = await collectEvents(getUserInputHandler, ctx);
      expect(events).toEqual(["inputReady"]);
      expect((ctx.resolved as Record<string, unknown>).description).toBe(
        "Build a workflow",
      );
    } finally {
      await cleanup();
    }
  });

  it("should yield noInput for missing file", async () => {
    const ctx = createDefineContext({
      params: { input: "/nonexistent/path.txt" },
    });
    const { events } = await collectEvents(getUserInputHandler, ctx);
    expect(events).toEqual(["noInput"]);
  });

  it("should yield noInput when no input source", async () => {
    const ctx = createDefineContext({ params: {} });
    const { events } = await collectEvents(getUserInputHandler, ctx);
    expect(events).toEqual(["noInput"]);
  });

  it("should use prompt as description", async () => {
    const ctx = createDefineContext({
      params: { prompt: "Create an order process" },
    });
    const { events } = await collectEvents(getUserInputHandler, ctx);
    expect(events).toEqual(["inputReady"]);
    expect((ctx.resolved as Record<string, unknown>).description).toBe(
      "Create an order process",
    );
  });

  it("should yield noInput for empty prompt", async () => {
    const ctx = createDefineContext({ params: { prompt: "   " } });
    const { events } = await collectEvents(getUserInputHandler, ctx);
    expect(events).toEqual(["noInput"]);
  });
});
