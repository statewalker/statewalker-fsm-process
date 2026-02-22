import { describe, it, expect, vi } from "vitest";
import { newStageSlot } from "../../../src/commons/stage/index.ts";

describe("newStageSlot", () => {
  it("publish adds model, listen retrieves it", () => {
    const [publish, listen] = newStageSlot<string>("key");
    const ctx: Record<string, unknown> = {};
    publish(ctx, "model1");
    const fn = vi.fn();
    listen(ctx, fn);
    expect(fn).toHaveBeenCalledWith(["model1"]);
  });

  it("listen does not fire immediately if no models published", () => {
    const [, listen] = newStageSlot<string>("key");
    const ctx: Record<string, unknown> = {};
    const fn = vi.fn();
    listen(ctx, fn);
    expect(fn).not.toHaveBeenCalled();
  });

  it("publish triggers existing listeners synchronously", () => {
    const [publish, listen] = newStageSlot<string>("key");
    const ctx: Record<string, unknown> = {};
    const fn = vi.fn();
    listen(ctx, fn);
    publish(ctx, "model1");
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(["model1"]);
  });

  it("listen fires immediately for already-published models", () => {
    const [publish, listen] = newStageSlot<string>("key");
    const ctx: Record<string, unknown> = {};
    publish(ctx, "model1");
    publish(ctx, "model2");
    const fn = vi.fn();
    listen(ctx, fn);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(["model1", "model2"]);
  });

  it("unpublish removes model", () => {
    const [publish, listen] = newStageSlot<string>("key");
    const ctx: Record<string, unknown> = {};
    const unpublish = publish(ctx, "model1");
    publish(ctx, "model2");
    unpublish();
    const fn = vi.fn();
    listen(ctx, fn);
    expect(fn).toHaveBeenCalledWith(["model2"]);
  });

  it("unlisten stops future notifications", () => {
    const [publish, listen] = newStageSlot<string>("key");
    const ctx: Record<string, unknown> = {};
    const fn = vi.fn();
    const unlisten = listen(ctx, fn);
    unlisten();
    publish(ctx, "model1");
    expect(fn).not.toHaveBeenCalled();
  });

  it("multiple listeners on same slot", () => {
    const [publish, listen] = newStageSlot<string>("key");
    const ctx: Record<string, unknown> = {};
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    listen(ctx, fn1);
    listen(ctx, fn2);
    publish(ctx, "model1");
    expect(fn1).toHaveBeenCalledOnce();
    expect(fn2).toHaveBeenCalledOnce();
  });

  it("different slots are independent", () => {
    const [publishA, listenA] = newStageSlot<string>("slotA");
    const [publishB, listenB] = newStageSlot<string>("slotB");
    const ctx: Record<string, unknown> = {};
    publishA(ctx, "a");
    publishB(ctx, "b");
    const fnA = vi.fn();
    const fnB = vi.fn();
    listenA(ctx, fnA);
    listenB(ctx, fnB);
    expect(fnA).toHaveBeenCalledWith(["a"]);
    expect(fnB).toHaveBeenCalledWith(["b"]);
  });

  it("stage is auto-created per context", () => {
    const [publish, listen] = newStageSlot<string>("key");
    const ctx1: Record<string, unknown> = {};
    const ctx2: Record<string, unknown> = {};
    publish(ctx1, "a");
    publish(ctx2, "b");
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    listen(ctx1, fn1);
    listen(ctx2, fn2);
    expect(fn1).toHaveBeenCalledWith(["a"]);
    expect(fn2).toHaveBeenCalledWith(["b"]);
  });

  it("multiple publishes accumulate", () => {
    const [publish, listen] = newStageSlot<number>("nums");
    const ctx: Record<string, unknown> = {};
    const fn = vi.fn();
    listen(ctx, fn);
    publish(ctx, 1);
    publish(ctx, 2);
    publish(ctx, 3);
    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenLastCalledWith([1, 2, 3]);
  });
});
