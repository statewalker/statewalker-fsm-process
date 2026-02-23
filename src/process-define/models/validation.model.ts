import type { ValidationIssue } from "@statewalker/fsm-validator";
import { newAdapter } from "@/shared/adapters/index.ts";
import { BaseClass } from "@/shared/base-class/index.ts";

export interface SemanticIssue {
  type: string;
  description: string;
  statePath: string;
  rule: string;
  suggestion: string;
}

export class ValidationModel extends BaseClass {
  structuralIssues: ValidationIssue[] = [];
  semanticIssues: SemanticIssue[] = [];
  isValid = false;

  update(structural: ValidationIssue[], semantic: SemanticIssue[]): void {
    this.structuralIssues = structural;
    this.semanticIssues = semantic;
    this.isValid = structural.length === 0 && semantic.length === 0;
    this.notify();
  }
}

export const [getValidationModel, setValidationModel] =
  newAdapter<ValidationModel>("define:validation", () => new ValidationModel());
