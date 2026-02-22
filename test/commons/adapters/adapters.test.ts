import { describe, it, expect, vi } from "vitest";
import { newAdapter } from "../../../src/commons/adapters/index.ts";

describe("newAdapter", () => {
  it("set then get returns the set value", () => {
    const [get, set] = newAdapter<string>("test");
    const ctx: Record<string, unknown> = {};
    set(ctx, "hello");
    expect(get(ctx)).toBe("hello");
  });

  it("throws when value is undefined and no factory provided", () => {
    const [get] = newAdapter<string>("missing");
    const ctx: Record<string, unknown> = {};
    expect(() => get(ctx)).toThrow('Adapter "missing" not found in context');
  });

  it("lazy factory creates value on first get", () => {
    const factory = vi.fn(() => 42);
    const [get] = newAdapter<number>("count", factory);
    const ctx: Record<string, unknown> = {};
    const value = get(ctx);
    expect(value).toBe(42);
    expect(factory).toHaveBeenCalledOnce();
  });

  it("lazy factory result is cached", () => {
    const factory = vi.fn(() => 42);
    const [get] = newAdapter<number>("count", factory);
    const ctx: Record<string, unknown> = {};
    get(ctx);
    get(ctx);
    expect(factory).toHaveBeenCalledOnce();
  });

  it("set before get with factory: factory is not called", () => {
    const factory = vi.fn(() => "default");
    const [get, set] = newAdapter<string>("key", factory);
    const ctx: Record<string, unknown> = {};
    set(ctx, "explicit");
    expect(get(ctx)).toBe("explicit");
    expect(factory).not.toHaveBeenCalled();
  });

  it("different contexts are independent", () => {
    const [get, set] = newAdapter<string>("key");
    const ctx1: Record<string, unknown> = {};
    const ctx2: Record<string, unknown> = {};
    set(ctx1, "a");
    set(ctx2, "b");
    expect(get(ctx1)).toBe("a");
    expect(get(ctx2)).toBe("b");
  });
});
