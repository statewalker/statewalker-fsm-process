import { describe, expect, it, vi } from "vitest";
import {
  getProcessInputModel,
  ProcessInputModel,
} from "../../../src/define/models/process-input.model.ts";

describe("ProcessInputModel", () => {
  it("initializes with empty defaults", () => {
    const model = new ProcessInputModel();
    expect(model.description).toBe("");
    expect(model.source).toBe("");
  });

  it("setDescription updates description and triggers notify", () => {
    const model = new ProcessInputModel();
    const fn = vi.fn();
    model.onUpdate(fn);
    model.setDescription("hello");
    expect(model.description).toBe("hello");
    expect(fn).toHaveBeenCalledOnce();
  });

  it("setDescription updates source when provided", () => {
    const model = new ProcessInputModel();
    const fn = vi.fn();
    model.onUpdate(fn);
    model.setDescription("hello", "file");
    expect(model.description).toBe("hello");
    expect(model.source).toBe("file");
    expect(fn).toHaveBeenCalledOnce();
  });

  it("setDescription keeps existing source when not provided", () => {
    const model = new ProcessInputModel();
    model.setDescription("first", "stdin");
    model.setDescription("second");
    expect(model.description).toBe("second");
    expect(model.source).toBe("stdin");
  });

  it("adapter lazy-creates on first get", () => {
    const ctx: Record<string, unknown> = {};
    const model = getProcessInputModel(ctx);
    expect(model).toBeInstanceOf(ProcessInputModel);
    expect(getProcessInputModel(ctx)).toBe(model);
  });
});
