/**
 * Component registry — maps model constructors to renderer factories.
 *
 * Creates a registry that associates model types (by constructor) with
 * factory functions. When {@link ComponentRegistry.resolve | resolve(model)}
 * is called, it looks up `model.constructor`, invokes the registered factory,
 * and returns the result. The factory is called on every `resolve` (no caching).
 * Registering the same model type twice overwrites silently (last wins).
 *
 * @template R - The renderer type returned by factories.
 * @returns A {@link ComponentRegistry} with `register` and `resolve` methods.
 *
 * @example
 * ```ts
 * const registry = createComponentRegistry<HTMLElement>();
 *
 * registry.register(CounterModel, (model) => {
 *   const el = document.createElement("div");
 *   el.textContent = String(model.value);
 *   return el;
 * });
 *
 * const view = registry.resolve(new CounterModel());
 * ```
 */
export function createComponentRegistry<R>(): ComponentRegistry<R> {
	const factories = new Map<Constructor, (model: unknown) => R>();

	function register<T>(
		modelType: Constructor<T>,
		factory: (model: T) => R,
	): void {
		factories.set(modelType, factory as (model: unknown) => R);
	}

	function resolve(model: object): R {
		const factory = factories.get(
			model.constructor as Constructor,
		);
		if (!factory) {
			throw new Error(
				`No renderer registered for ${model.constructor.name}`,
			);
		}
		return factory(model);
	}

	return { register, resolve };
}

/** A constructor type used as the registry map key. */
// biome-ignore lint/suspicious/noExplicitAny: Constructor must accept any args for generic model matching
export type Constructor<T = unknown> = new (...args: any[]) => T;

/** Registry returned by {@link createComponentRegistry}. */
export interface ComponentRegistry<R> {
	/**
	 * Associates a model type with a renderer factory.
	 *
	 * @param modelType - Constructor of the model class.
	 * @param factory - Function that creates a renderer from a model instance.
	 */
	register<T>(modelType: Constructor<T>, factory: (model: T) => R): void;

	/**
	 * Looks up the factory for `model.constructor` and calls it.
	 * Throws if no factory is registered for the model's type.
	 *
	 * @param model - The model instance to resolve a renderer for.
	 * @returns A new renderer produced by the registered factory.
	 */
	resolve(model: object): R;
}
