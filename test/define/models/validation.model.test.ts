import type { ValidationIssue } from "@statewalker/fsm-validator";
import { describe, expect, it, vi } from "vitest";
import type { SemanticIssue } from "../../../src/define/models/validation.model.ts";
import {
  getValidationModel,
  ValidationModel,
} from "../../../src/define/models/validation.model.ts";

describe("ValidationModel", () => {
  const structuralIssue: ValidationIssue = {
    rule: "S1" as ValidationIssue["rule"],
    severity: "error" as ValidationIssue["severity"],
    message: "Missing transitions",
    path: ["Root"],
  };

  const semanticIssue: SemanticIssue = {
    type: "goal_misalignment",
    description: "Goal does not match transitions",
    statePath: "Root.Sub",
    rule: "M4",
    suggestion: "Align goal with transitions",
  };

  it("initializes with empty defaults", () => {
    const model = new ValidationModel();
    expect(model.structuralIssues).toEqual([]);
    expect(model.semanticIssues).toEqual([]);
    expect(model.isValid).toBe(false);
  });

  it("update with no issues sets isValid to true", () => {
    const model = new ValidationModel();
    const fn = vi.fn();
    model.onUpdate(fn);
    model.update([], []);
    expect(model.isValid).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("update with structural issues sets isValid to false", () => {
    const model = new ValidationModel();
    model.update([structuralIssue], []);
    expect(model.isValid).toBe(false);
    expect(model.structuralIssues).toEqual([structuralIssue]);
    expect(model.semanticIssues).toEqual([]);
  });

  it("update with semantic issues sets isValid to false", () => {
    const model = new ValidationModel();
    model.update([], [semanticIssue]);
    expect(model.isValid).toBe(false);
    expect(model.structuralIssues).toEqual([]);
    expect(model.semanticIssues).toEqual([semanticIssue]);
  });

  it("update with both issue types sets isValid to false", () => {
    const model = new ValidationModel();
    model.update([structuralIssue], [semanticIssue]);
    expect(model.isValid).toBe(false);
  });

  it("update replaces previous issues", () => {
    const model = new ValidationModel();
    model.update([structuralIssue], [semanticIssue]);
    model.update([], []);
    expect(model.isValid).toBe(true);
    expect(model.structuralIssues).toEqual([]);
    expect(model.semanticIssues).toEqual([]);
  });

  it("adapter lazy-creates on first get", () => {
    const ctx: Record<string, unknown> = {};
    const model = getValidationModel(ctx);
    expect(model).toBeInstanceOf(ValidationModel);
    expect(getValidationModel(ctx)).toBe(model);
  });
});
