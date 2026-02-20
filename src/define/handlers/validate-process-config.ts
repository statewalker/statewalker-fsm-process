import type { StageHandler } from "@statewalker/fsm";
import {
  type FsmStateConfig,
  formatRulesAsText,
  prompts,
  semanticRules,
  type ValidationResult,
  validate,
} from "@statewalker/fsm-validator";
import { stringify } from "yaml";
import { z } from "zod";
import { newAdapter } from "../../adapter.ts";
import { getGenerateObject } from "../context.ts";

const [getResolved] = newAdapter<Record<string, unknown>>(
  "resolved",
  () => ({}),
);

const semanticIssueSchema = z.object({
  incoherencies: z.array(
    z.object({
      rule: z.string(),
      statePath: z.string(),
      issue: z.string(),
    }),
  ),
});

export const validateProcessConfigHandler: StageHandler<
  Record<string, unknown>
> = async function* (context) {
  const resolved = getResolved(context);
  const config = resolved.config as FsmStateConfig;

  // Phase 1: Structural validation
  const validationResult: ValidationResult = validate(config);
  resolved.validationResult = validationResult;

  if (validationResult.errors.length > 0) {
    resolved.allIssues = formatStructuralIssues(validationResult);
    yield "validationFailed";
    return;
  }

  // Phase 2: Semantic coherence (AI)
  const generateObject = getGenerateObject(context);
  const configYaml = stringify(config);
  const rulesText = formatRulesAsText(semanticRules);

  try {
    const result = await generateObject({
      system: prompts.validation,
      prompt: [
        "# Configuration to validate",
        "```yaml",
        configYaml,
        "```",
        "",
        "# Semantic rules to evaluate",
        rulesText,
        "",
        "Evaluate the configuration for goal alignment (M9), event-state consistency (M8), and convergent transition compatibility (M4).",
        "Return any incoherencies found.",
      ].join("\n"),
      schema: semanticIssueSchema,
    });

    const parsed = result.object as z.infer<typeof semanticIssueSchema>;
    resolved.semanticIssues = parsed.incoherencies;

    const allIssues = formatStructuralIssues(validationResult);
    if (parsed.incoherencies.length > 0) {
      const semanticText = parsed.incoherencies
        .map((i) => `[${i.rule}] ${i.statePath}: ${i.issue}`)
        .join("\n");
      resolved.allIssues = allIssues
        ? `${allIssues}\n\n# Semantic Issues\n${semanticText}`
        : `# Semantic Issues\n${semanticText}`;
    } else {
      resolved.allIssues = allIssues;
    }

    const hasStructuralIssues =
      validationResult.errors.length > 0 ||
      validationResult.warnings.length > 0;
    const hasSemanticIssues = parsed.incoherencies.length > 0;

    if (hasStructuralIssues || hasSemanticIssues) {
      yield "validationFailed";
    } else {
      yield "configValid";
    }
  } catch {
    // If AI fails, still report structural issues
    resolved.allIssues = formatStructuralIssues(validationResult);
    if (
      validationResult.errors.length > 0 ||
      validationResult.warnings.length > 0
    ) {
      yield "validationFailed";
    } else {
      yield "configValid";
    }
  }
};

function formatStructuralIssues(result: ValidationResult): string {
  const parts: string[] = [];
  if (result.errors.length > 0) {
    parts.push(
      "# Errors\n" +
        result.errors
          .map((e) => `[${e.rule}] ${e.path.join(".")}: ${e.message}`)
          .join("\n"),
    );
  }
  if (result.warnings.length > 0) {
    parts.push(
      "# Warnings\n" +
        result.warnings
          .map((w) => `[${w.rule}] ${w.path.join(".")}: ${w.message}`)
          .join("\n"),
    );
  }
  if (result.semantic.length > 0) {
    parts.push(
      "# Semantic\n" +
        result.semantic
          .map((s) => `[${s.rule}] ${s.path.join(".")}: ${s.message}`)
          .join("\n"),
    );
  }
  return parts.join("\n\n");
}
