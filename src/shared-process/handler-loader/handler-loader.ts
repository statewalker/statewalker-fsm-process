import type { StageHandler } from "@statewalker/fsm";
import type { FsmStateConfig } from "@statewalker/fsm-validator";

export type ExecutionContext = Record<string, unknown>;

export type HandlerMap<C extends ExecutionContext = ExecutionContext> = Record<
	string,
	StageHandler<C> | StageHandler<C>[]
>;

export function findStateConfig(
	root: FsmStateConfig,
	key: string,
): FsmStateConfig | undefined {
	if (root.key === key) return root;
	if (root.states) {
		for (const child of root.states) {
			const found = findStateConfig(child, key);
			if (found) return found;
		}
	}
	return undefined;
}

function isLeafState(config: FsmStateConfig, key: string): boolean {
	const stateConfig = findStateConfig(config, key);
	return stateConfig
		? !stateConfig.states || stateConfig.states.length === 0
		: false;
}

export function createHandlerLoader<
	C extends ExecutionContext = ExecutionContext,
>(
	config: FsmStateConfig,
	handlers: HandlerMap<C>,
	defaultHandler: StageHandler<C>,
): (state: string, event: string | undefined) => StageHandler<C>[] {
	return (state: string, _event: string | undefined): StageHandler<C>[] => {
		const explicit = handlers[state];
		if (explicit) return Array.isArray(explicit) ? explicit : [explicit];
		if (isLeafState(config, state)) return [defaultHandler];
		return [];
	};
}
