import { describe, expect, it, vi } from "vitest";
import {
  getOutputModel,
  OutputModel,
} from "../../../src/define/models/output.model.ts";

describe("OutputModel", () => {
  it("initializes with empty defaults", () => {
    const model = new OutputModel();
    expect(model.content).toBe("");
    expect(model.destination).toBe("");
    expect(model.isWritten).toBe(false);
  });

  it("setContent updates fields and triggers notify", () => {
    const model = new OutputModel();
    const fn = vi.fn();
    model.onUpdate(fn);
    model.setContent("key: Root", "/out/file.yaml");
    expect(model.content).toBe("key: Root");
    expect(model.destination).toBe("/out/file.yaml");
    expect(model.isWritten).toBe(false);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("markWritten sets isWritten and triggers notify", () => {
    const model = new OutputModel();
    model.setContent("yaml", "dest");
    const fn = vi.fn();
    model.onUpdate(fn);
    model.markWritten();
    expect(model.isWritten).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("setContent resets isWritten to false", () => {
    const model = new OutputModel();
    model.setContent("first", "dest");
    model.markWritten();
    expect(model.isWritten).toBe(true);
    model.setContent("second", "dest2");
    expect(model.isWritten).toBe(false);
  });

  it("adapter lazy-creates on first get", () => {
    const ctx: Record<string, unknown> = {};
    const model = getOutputModel(ctx);
    expect(model).toBeInstanceOf(OutputModel);
    expect(getOutputModel(ctx)).toBe(model);
  });
});
