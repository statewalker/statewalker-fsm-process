import { Tracer } from "../../src/observe/tracer.ts";
import { describe, expect, it } from "../deps.ts";

describe("Tracer", () => {
  it("should record enter entries via asHandler", async () => {
    const tracer = new Tracer();
    const handler = tracer.asHandler();

    const ctx = { "fsm:states": ["Root", "Child"] };
    handler(ctx);

    const entries = tracer.toJSON();
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("enter");
    expect(entries[0].stateKey).toBe("Child");
    expect(entries[0].statePath).toEqual(["Root", "Child"]);
    expect(entries[0].depth).toBe(1);
  });

  it("should record exit entries with duration via cleanup", async () => {
    const tracer = new Tracer();
    const handler = tracer.asHandler();

    const ctx = { "fsm:states": ["Root", "Child"] };
    const cleanup = handler(ctx);

    expect(typeof cleanup).toBe("function");

    // Simulate some time
    await new Promise((r) => setTimeout(r, 10));
    if (typeof cleanup === "function") {
      await cleanup();
    }

    const entries = tracer.toJSON();
    expect(entries).toHaveLength(2);
    expect(entries[1].type).toBe("exit");
    expect(entries[1].stateKey).toBe("Child");
    expect(entries[1].duration).toBeGreaterThanOrEqual(0);
  });

  it("should do nothing when context has no states", () => {
    const tracer = new Tracer();
    const handler = tracer.asHandler();

    handler({});
    expect(tracer.toJSON()).toHaveLength(0);
  });

  it("should record dispatch events", () => {
    const tracer = new Tracer();
    tracer.dispatch("toggle", ["Root", "Off"]);

    const entries = tracer.toJSON();
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("dispatch");
    expect(entries[0].event).toBe("toggle");
    expect(entries[0].stateKey).toBe("Off");
  });

  it("should record artifacts", () => {
    const tracer = new Tracer();
    tracer.artifact(["Root", "Step"], { text: "result" });

    const entries = tracer.toJSON();
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("artifact");
    expect(entries[0].data).toEqual({ text: "result" });
  });

  it("should record errors", () => {
    const tracer = new Tracer();
    tracer.error(["Root", "Step"], new Error("boom"));

    const entries = tracer.toJSON();
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe("error");
    expect(entries[0].data).toEqual({ message: "boom", name: "Error" });
  });

  it("should convert to chart events", () => {
    const tracer = new Tracer();
    const handler = tracer.asHandler();

    const ctx = { "fsm:states": ["Root"] };
    const cleanup = handler(ctx);
    if (typeof cleanup === "function") cleanup();

    const chartEvents = tracer.toChartEvents();
    expect(chartEvents).toHaveLength(2);
    expect(chartEvents[0].type).toBe("activate");
    expect(chartEvents[0].stateIds).toEqual(["Root"]);
    expect(chartEvents[1].type).toBe("deactivate");
  });

  it("should return a copy from toJSON", () => {
    const tracer = new Tracer();
    tracer.dispatch("test", ["Root"]);

    const a = tracer.toJSON();
    const b = tracer.toJSON();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});
