import { describe, expect, it } from "vitest";
import { getParams, setParams } from "@/shared-process/adapters/params.adapter";

describe("params adapter", () => {
  it("getParams returns empty object by default", () => {
    const ctx: Record<string, unknown> = {};
    expect(getParams(ctx)).toEqual({});
  });

  it("setParams stores and getParams retrieves", () => {
    const ctx: Record<string, unknown> = {};
    const params = { foo: "bar" };
    setParams(ctx, params);
    expect(getParams(ctx)).toBe(params);
  });

  it("getParams returns same instance for same context", () => {
    const ctx: Record<string, unknown> = {};
    expect(getParams(ctx)).toBe(getParams(ctx));
  });

  it("different contexts get independent params", () => {
    const ctx1: Record<string, unknown> = {};
    const ctx2: Record<string, unknown> = {};
    setParams(ctx1, { a: 1 });
    setParams(ctx2, { b: 2 });
    expect(getParams(ctx1)).toEqual({ a: 1 });
    expect(getParams(ctx2)).toEqual({ b: 2 });
  });
});
