import type { StageHandler } from "@statewalker/fsm";
import {
	type FsmStateConfig,
	type RuleDefinition,
	type RuleId,
	type ValidationIssue,
	type ValidationResult,
	getRulesByIds,
	prompts,
	semanticRules,
	validate,
} from "@statewalker/fsm-validator";
import { stringify } from "yaml";
import { z } from "zod";
import { getGenerateObject } from "../../adapters/generate-object.adapter.ts";
import { getLogger } from "../../adapters/logger.adapter.ts";
import { getResolved } from "../../adapters/resolved.adapter.ts";

const semanticIssueSchema = z.object({
	incoherencies: z
		.array(
			z.object({
				type: z
					.string()
					.describe(
						"Type of incoherency: goal_misalignment, event_state_inconsistency, convergent_transition_incompatibility, or other semantic category",
					),
				description: z
					.string()
					.describe(
						"Detailed description of the identified issue, explaining what is wrong and why it matters",
					),
				statePath: z
					.string()
					.describe(
						"Dot-separated path to the affected configuration element (e.g. Root.Parent.Child, or Root.Parent.eventName)",
					),
				rule: z
					.string()
					.describe(
						"ID of the violated validation rule (e.g. M4, M8, M9)",
					),
				suggestion: z
					.string()
					.describe(
						"Actionable suggestion for how to fix the issue, including specific changes to state names, events, transitions, or descriptions",
					),
			}),
		)
		.describe(
			"List of semantic incoherencies found in the configuration",
		),
});

export type SemanticIssue = z.infer<typeof semanticIssueSchema>["incoherencies"][number];

export const validateProcessConfigHandler: StageHandler<
	Record<string, unknown>
> = async function* (context) {
	const resolved = getResolved(context);
	const logger = getLogger(context);
	const config = resolved.config as FsmStateConfig;

	// Phase 1: Structural validation
	const validationResult: ValidationResult = validate(config);
	resolved.validationResult = validationResult;

	// Phase 2: Semantic coherence (AI) — runs even if structural errors exist
	const generateObject = getGenerateObject(context);
	const configYaml = stringify(config);

	// Build structured issues tree from structural validation
	const issuesTree = buildIssuesTree(validationResult);

	// Collect all rule IDs referenced in structural issues + semantic rules to check
	const semanticRuleIds: RuleId[] = ["M4", "M8", "M9"];
	const referencedRuleIds = collectRuleIds(validationResult, semanticRuleIds);
	const rulesReference = buildRulesReference(referencedRuleIds);

	try {
		const prompt = [
			"# Configuration to validate",
			"```yaml",
			configYaml,
			"```",
			"",
			...(issuesTree
				? [
						"# Structural validation results",
						"```yaml",
						stringify(issuesTree),
						"```",
						"",
					]
				: []),
			"# Semantic elements to verify",
			"```yaml",
			stringify(
				semanticRules.map((r) => ({
					rule: r.ruleId,
					description: r.rule,
					constraint: r.constraint,
				})),
			),
			"```",
			"",
			"# Rules reference",
			"```yaml",
			stringify(rulesReference),
			"```",
			"",
			"Evaluate the configuration for semantic coherence. For each incoherency found, return:",
			"- type: the category of incoherency (goal_misalignment, event_state_inconsistency, convergent_transition_incompatibility)",
			"- description: detailed explanation of the issue",
			"- statePath: dot-separated path to the affected element (e.g. Root.Parent.Child)",
			"- rule: the ID of the violated rule (e.g. M4, M8, M9)",
			"- suggestion: actionable fix recommendation with specific changes",
		].join("\n");

		logger.debug("Validation prompt:", prompt);
		const result = await generateObject({
			system: prompts.validation,
			prompt,
			schema: semanticIssueSchema,
		});

		const parsed = result.object as z.infer<typeof semanticIssueSchema>;
		resolved.semanticIssues = parsed.incoherencies;

		// Build combined allIssues as structured YAML
		resolved.allIssues = buildAllIssuesYaml(
			validationResult,
			parsed.incoherencies,
		);

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
		resolved.allIssues = buildAllIssuesYaml(validationResult, []);
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

type IssueEntry = { rule: string; severity: string; message: string };
type IssuesTreeNode = Record<string, IssueEntry[] | Record<string, IssueEntry[]>>;

function buildIssuesTree(
	result: ValidationResult,
): { structural_issues: IssuesTreeNode } | null {
	const allIssues = [...result.errors, ...result.warnings, ...result.semantic];
	if (allIssues.length === 0) return null;

	const tree: IssuesTreeNode = {};
	for (const issue of allIssues) {
		const pathKey = issue.path.length > 0 ? issue.path.join(".") : "(root)";
		if (!tree[pathKey]) {
			tree[pathKey] = [];
		}
		(tree[pathKey] as IssueEntry[]).push({
			rule: issue.rule,
			severity: issue.severity,
			message: issue.message,
		});
	}

	return { structural_issues: tree };
}

function collectRuleIds(
	result: ValidationResult,
	extraRuleIds: RuleId[],
): RuleId[] {
	const ids = new Set<RuleId>(extraRuleIds);
	for (const issue of result.issues) {
		ids.add(issue.rule);
	}
	return [...ids];
}

function buildRulesReference(
	ruleIds: RuleId[],
): Array<{ rule: string; name: string; severity: string | null; constraint: string }> {
	const rules: RuleDefinition[] = getRulesByIds(ruleIds);
	return rules.map((r) => ({
		rule: r.ruleId,
		name: r.rule,
		severity: r.severity,
		constraint: r.constraint,
	}));
}

function buildAllIssuesYaml(
	validationResult: ValidationResult,
	semanticIssues: SemanticIssue[],
): string {
	const report: Record<string, unknown> = {};

	if (validationResult.errors.length > 0) {
		report.errors = formatIssuesList(validationResult.errors);
	}
	if (validationResult.warnings.length > 0) {
		report.warnings = formatIssuesList(validationResult.warnings);
	}
	if (validationResult.semantic.length > 0) {
		report.structural_semantic = formatIssuesList(validationResult.semantic);
	}
	if (semanticIssues.length > 0) {
		report.semantic_incoherencies = semanticIssues.map((i) => ({
			type: i.type,
			rule: i.rule,
			statePath: i.statePath,
			description: i.description,
			suggestion: i.suggestion,
		}));
	}

	if (Object.keys(report).length === 0) return "";
	return stringify(report);
}

function formatIssuesList(
	issues: ValidationIssue[],
): Array<{ rule: string; path: string; message: string }> {
	return issues.map((i) => ({
		rule: i.rule,
		path: i.path.join("."),
		message: i.message,
	}));
}
