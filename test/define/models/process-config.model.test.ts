import { describe, expect, it, vi } from "vitest";
import {
  getProcessConfigModel,
  ProcessConfigModel,
} from "../../../src/define/models/process-config.model.ts";

describe("ProcessConfigModel", () => {
  it("initializes with correct defaults", () => {
    const model = new ProcessConfigModel();
    expect(model.config).toBeUndefined();
    expect(model.iteration).toBe(0);
    expect(model.isGenerating).toBe(false);
    expect(model.maxIterations).toBe(5);
  });

  it("startGeneration sets isGenerating and increments iteration", () => {
    const model = new ProcessConfigModel();
    const fn = vi.fn();
    model.onUpdate(fn);
    const complete = model.startGeneration();
    expect(model.isGenerating).toBe(true);
    expect(model.iteration).toBe(1);
    expect(fn).toHaveBeenCalledOnce();
    expect(typeof complete).toBe("function");
  });

  it("completion callback with config updates state and notifies", () => {
    const model = new ProcessConfigModel();
    const fn = vi.fn();
    const complete = model.startGeneration();
    model.onUpdate(fn);
    const config = { key: "Root" };
    complete({ config });
    expect(model.isGenerating).toBe(false);
    expect(model.config).toBe(config);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("completion callback with error still clears isGenerating", () => {
    const model = new ProcessConfigModel();
    const complete = model.startGeneration();
    expect(model.isGenerating).toBe(true);
    complete({ error: new Error("fail") });
    expect(model.isGenerating).toBe(false);
    expect(model.config).toBeUndefined();
  });

  it("multiple generation cycles increment iteration", () => {
    const model = new ProcessConfigModel();
    const c1 = model.startGeneration();
    c1({ config: { key: "V1" } });
    const c2 = model.startGeneration();
    expect(model.iteration).toBe(2);
    c2({ config: { key: "V2" } });
    expect(model.config).toEqual({ key: "V2" });
  });

  it("adapter lazy-creates on first get", () => {
    const ctx: Record<string, unknown> = {};
    const model = getProcessConfigModel(ctx);
    expect(model).toBeInstanceOf(ProcessConfigModel);
    expect(getProcessConfigModel(ctx)).toBe(model);
  });
});
