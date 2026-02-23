import { describe, expect, it } from "vitest";
import { getConfig, setConfig } from "@/shared-process/adapters/config.adapter";

describe("config adapter", () => {
  it("setConfig stores and getConfig retrieves", () => {
    const ctx: Record<string, unknown> = {};
    const config = {
      key: "Root",
      transitions: [["", "*", "A"]],
      states: [{ key: "A" }],
    };
    setConfig(ctx, config);
    expect(getConfig(ctx)).toBe(config);
  });

  it("getConfig returns same reference for same context", () => {
    const ctx: Record<string, unknown> = {};
    const config = { key: "R", transitions: [], states: [] };
    setConfig(ctx, config);
    expect(getConfig(ctx)).toBe(getConfig(ctx));
  });

  it("different contexts are independent", () => {
    const ctx1: Record<string, unknown> = {};
    const ctx2: Record<string, unknown> = {};
    const c1 = { key: "A", transitions: [], states: [] };
    const c2 = { key: "B", transitions: [], states: [] };
    setConfig(ctx1, c1);
    setConfig(ctx2, c2);
    expect(getConfig(ctx1)).toBe(c1);
    expect(getConfig(ctx2)).toBe(c2);
  });
});
