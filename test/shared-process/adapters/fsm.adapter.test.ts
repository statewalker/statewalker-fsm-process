import { describe, expect, it } from "vitest";
import {
  EventModel,
  getEvents,
  getFsmEvent,
  getFsmStack,
} from "@/shared-process/adapters/fsm.adapter";

describe("fsm adapter: getFsmStack / getFsmEvent", () => {
  it("getFsmStack returns empty array by default", () => {
    const ctx: Record<string, unknown> = {};
    expect(getFsmStack(ctx)).toEqual([]);
  });

  it("getFsmStack returns same array for same context", () => {
    const ctx: Record<string, unknown> = {};
    expect(getFsmStack(ctx)).toBe(getFsmStack(ctx));
  });

  it("getFsmEvent returns null by default", () => {
    const ctx: Record<string, unknown> = {};
    expect(getFsmEvent(ctx)).toBeNull();
  });

  it("different contexts get independent values", () => {
    const ctx1: Record<string, unknown> = {};
    const ctx2: Record<string, unknown> = {};
    expect(getFsmStack(ctx1)).not.toBe(getFsmStack(ctx2));
  });
});

describe("fsm adapter: EventModel", () => {
  it("EventModel has emit and readEvents methods", () => {
    const model = new EventModel();
    expect(typeof model.emit).toBe("function");
    expect(typeof model.readEvents).toBe("function");
  });

  it("event is null initially", () => {
    const model = new EventModel();
    expect(model.event).toBeNull();
  });

  it("emit sets the current event", () => {
    const model = new EventModel();
    model.emit("go");
    expect(model.event).toBe("go");
  });

  it("readEvents yields emitted events", async () => {
    const model = new EventModel();
    const gen = model.readEvents()[Symbol.asyncIterator]();
    model.emit("a");
    expect((await gen.next()).value).toBe("a");
    model.emit("b");
    expect((await gen.next()).value).toBe("b");
    await gen.return!(undefined as never);
  });

  it("readEvents waits when no event is available", async () => {
    const model = new EventModel();
    const gen = model.readEvents()[Symbol.asyncIterator]();
    const promise = gen.next();
    model.emit("x");
    expect((await promise).value).toBe("x");
    await gen.return!(undefined as never);
  });
});

describe("fsm adapter: getEvents", () => {
  it("getEvents returns an EventModel for context", () => {
    const ctx: Record<string, unknown> = {};
    const events = getEvents(ctx);
    expect(events).toBeInstanceOf(EventModel);
  });

  it("getEvents returns same instance for same context", () => {
    const ctx: Record<string, unknown> = {};
    expect(getEvents(ctx)).toBe(getEvents(ctx));
  });

  it("different contexts get independent EventModels", () => {
    const ctx1: Record<string, unknown> = {};
    const ctx2: Record<string, unknown> = {};
    expect(getEvents(ctx1)).not.toBe(getEvents(ctx2));
  });
});
