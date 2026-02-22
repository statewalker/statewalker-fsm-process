import { describe, it, expect, vi } from "vitest";
import { newRegistry } from "../../../src/commons/registry/index.ts";

describe("newRegistry", () => {
  it("cleanup runs registered functions in LIFO order", () => {
    const [register, cleanup] = newRegistry();
    const order: number[] = [];
    register(() => order.push(1));
    register(() => order.push(2));
    register(() => order.push(3));
    cleanup();
    expect(order).toEqual([3, 2, 1]);
  });

  it("cleanup clears all registrations", () => {
    const [register, cleanup] = newRegistry();
    const fn = vi.fn();
    register(fn);
    cleanup();
    cleanup();
    expect(fn).toHaveBeenCalledOnce();
  });

  it("register returns a remove function", () => {
    const [register] = newRegistry();
    const fn = vi.fn();
    const remove = register(fn);
    remove();
    expect(fn).toHaveBeenCalledOnce();
  });

  it("removed registration is not called on cleanup", () => {
    const [register, cleanup] = newRegistry();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const remove1 = register(fn1);
    register(fn2);
    remove1();
    fn1.mockClear();
    cleanup();
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledOnce();
  });

  it("register with no cleanup arg is allowed", () => {
    const [register, cleanup] = newRegistry();
    const remove = register();
    expect(() => remove()).not.toThrow();
    expect(() => cleanup()).not.toThrow();
  });

  it("onError is called when cleanup throws", () => {
    const onError = vi.fn();
    const [register] = newRegistry(onError);
    register(() => {
      throw new Error("boom");
    });
    const remove = register(() => {
      throw new Error("boom");
    });
    remove();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("empty registry cleanup is a no-op", () => {
    const [, cleanup] = newRegistry();
    expect(() => cleanup()).not.toThrow();
  });
});
