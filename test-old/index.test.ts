import { newAdapter } from "../src/adapters/new-adapter.ts";
import { describe, expect, it } from "./deps.ts";

describe("newAdapter", () => {
  it("should set and get a value", () => {
    const [get, set] = newAdapter<string>("name");
    const ctx: Record<string, unknown> = {};
    set(ctx, "hello");
    expect(get(ctx)).toBe("hello");
  });

  it("should return undefined when no value and no factory", () => {
    const [get] = newAdapter<string>("missing");
    const ctx: Record<string, unknown> = {};
    expect(get(ctx)).toBeUndefined();
  });

  it("should use factory when value is undefined", () => {
    const [get] = newAdapter<number[]>("items", () => []);
    const ctx: Record<string, unknown> = {};
    const items = get(ctx);
    expect(items).toEqual([]);
    items.push(1);
    expect(get(ctx)).toEqual([1]);
  });

  it("should not use factory when value is explicitly set", () => {
    const [get, set] = newAdapter<number>("count", () => 42);
    const ctx: Record<string, unknown> = {};
    set(ctx, 7);
    expect(get(ctx)).toBe(7);
  });

  it("should work with different keys on the same context", () => {
    const [getA, setA] = newAdapter<string>("a");
    const [getB, setB] = newAdapter<number>("b");
    const ctx: Record<string, unknown> = {};
    setA(ctx, "alpha");
    setB(ctx, 42);
    expect(getA(ctx)).toBe("alpha");
    expect(getB(ctx)).toBe(42);
  });
});
