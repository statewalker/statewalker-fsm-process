import type { StageHandler } from "@statewalker/fsm";
import { type RuleId, getRulesByIds, prompts } from "@statewalker/fsm-validator";
import { parse, stringify } from "yaml";
import { getGenerateObject } from "../../adapters/generate-object.adapter.ts";
import { getLogger } from "../../adapters/logger.adapter.ts";
import { getMaxIterations } from "../../adapters/max-iterations.adapter.ts";
import { getResolved } from "../../adapters/resolved.adapter.ts";
import { fsmStateConfigSchema } from "../schema.ts";

export const refineProcessConfigHandler: StageHandler<Record<string, unknown>> =
	async function* (context) {
		const resolved = getResolved(context);
		const logger = getLogger(context);
		const maxIterations = getMaxIterations(context);
		const iteration = ((resolved.iteration as number) ?? 0) + 1;
		resolved.iteration = iteration;

		if (iteration > maxIterations) {
			logger.error(
				`Refinement failed: exceeded ${maxIterations} iterations without producing a valid config`,
			);
			yield "generationFailed";
			return;
		}

		const generateObject = getGenerateObject(context);
		const configYaml = stringify(resolved.config);
		const allIssuesYaml = resolved.allIssues as string;

		// Parse the structured issues to build actionable guidance
		const guidance = buildRefinementGuidance(allIssuesYaml);

		try {
			const result = await generateObject({
				system: prompts.refinement,
				prompt: [
					"# Current Configuration",
					"```yaml",
					configYaml,
					"```",
					"",
					"# Validation Issues to Fix",
					guidance,
					"",
					"Fix all reported issues while preserving the overall process structure and semantics.",
					"Return the complete refined configuration.",
				].join("\n"),
				schema: fsmStateConfigSchema,
			});
			resolved.config = result.object;
			yield "configRefined";
		} catch (err) {
			logger.error(`AI refinement failed (iteration ${iteration}):`, err);
			resolved.error = err;
			yield "generationFailed";
		}
	};

function buildRefinementGuidance(allIssuesYaml: string): string {
	if (!allIssuesYaml) return "No specific issues reported.";

	let issues: Record<string, unknown>;
	try {
		issues = parse(allIssuesYaml) as Record<string, unknown>;
	} catch {
		// If YAML parsing fails, return raw text as-is
		return allIssuesYaml;
	}

	if (!issues || typeof issues !== "object") return allIssuesYaml;

	const sections: string[] = [];

	// Structural errors — must fix
	if (issues.errors && Array.isArray(issues.errors)) {
		const ruleIds = collectRuleIdsFromIssues(issues.errors);
		const rulesRef = getRulesByIds(ruleIds);
		sections.push(
			"## Structural Errors (must fix)",
			"```yaml",
			stringify(issues.errors),
			"```",
			...(rulesRef.length > 0
				? [
						"Referenced rules:",
						...rulesRef.map(
							(r) => `- [${r.ruleId}] ${r.rule}: ${r.constraint}`,
						),
					]
				: []),
		);
	}

	// Structural warnings — should fix
	if (issues.warnings && Array.isArray(issues.warnings)) {
		const ruleIds = collectRuleIdsFromIssues(issues.warnings);
		const rulesRef = getRulesByIds(ruleIds);
		sections.push(
			"## Structural Warnings (should fix)",
			"```yaml",
			stringify(issues.warnings),
			"```",
			...(rulesRef.length > 0
				? [
						"Referenced rules:",
						...rulesRef.map(
							(r) => `- [${r.ruleId}] ${r.rule}: ${r.constraint}`,
						),
					]
				: []),
		);
	}

	// Semantic incoherencies — with actionable suggestions
	if (
		issues.semantic_incoherencies &&
		Array.isArray(issues.semantic_incoherencies)
	) {
		sections.push("## Semantic Incoherencies (must fix)");
		for (const issue of issues.semantic_incoherencies) {
			const i = issue as Record<string, string>;
			sections.push(
				`### [${i.rule}] ${i.type} at ${i.statePath}`,
				`**Issue:** ${i.description}`,
				`**Fix:** ${i.suggestion}`,
			);
		}
	}

	return sections.length > 0 ? sections.join("\n") : allIssuesYaml;
}

function collectRuleIdsFromIssues(
	issues: unknown[],
): RuleId[] {
	const ids = new Set<RuleId>();
	for (const issue of issues) {
		if (issue && typeof issue === "object" && "rule" in issue) {
			ids.add((issue as { rule: string }).rule as RuleId);
		}
	}
	return [...ids];
}
