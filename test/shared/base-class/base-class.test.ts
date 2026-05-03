import { describe, expect, it, vi } from "vitest";
import { Base } from "@/shared/base-class/index.ts";

describe("BaseClass", () => {
  it("calls subscribers on notify", () => {
    const obj = new BaseClass();
    const fn = vi.fn();
    obj.autorun(fn);
    obj.notify();
    expect(fn).toHaveBeenCalledOnce();
  });

  it("does not call unsubscribed callbacks", () => {
    const obj = new BaseClass();
    const fn = vi.fn();
    const unsub = obj.autorun(fn);
    unsub();
    obj.notify();
    expect(fn).not.toHaveBeenCalled();
  });

  it("notify with no subscribers is a no-op", () => {
    const obj = new BaseClass();
    expect(() => obj.notify()).not.toThrow();
  });

  it("supports multiple subscribers", () => {
    const obj = new BaseClass();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    obj.autorun(fn1);
    obj.autorun(fn2);
    obj.notify();
    expect(fn1).toHaveBeenCalledOnce();
    expect(fn2).toHaveBeenCalledOnce();
  });

  it("subscribing same callback twice creates two subscriptions", () => {
    const obj = new BaseClass();
    const fn = vi.fn();
    obj.autorun(fn);
    obj.autorun(fn);
    obj.notify();
    // Set-based: same reference added once, so called once
    expect(fn).toHaveBeenCalledOnce();
  });

  it("unsubscribing one does not affect others", () => {
    const obj = new BaseClass();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const unsub1 = obj.autorun(fn1);
    obj.autorun(fn2);
    unsub1();
    obj.notify();
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledOnce();
  });
});
