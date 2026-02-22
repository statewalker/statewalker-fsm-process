/**
 * Creates a cleanup registry that tracks disposable resources in LIFO order.
 *
 * Returns a `[register, cleanup]` tuple. Each `register(fn)` call adds a
 * teardown function and returns a `remove` handle that runs `fn` immediately
 * and removes it from the registry. Calling `cleanup()` runs all remaining
 * teardown functions in reverse registration order (LIFO), then clears the
 * registry. Errors thrown by individual teardown functions are forwarded to
 * `onError` and do not interrupt the remaining cleanups.
 *
 * @param onError - Error handler invoked when a teardown function throws.
 *                  Defaults to `console.log`.
 * @returns `[register, cleanup]`
 *   - `register(fn?)` — adds `fn` to the registry; returns a `remove` function.
 *   - `cleanup()` — runs all registered functions in LIFO order and clears.
 *
 * @example
 * ```ts
 * const [register, cleanup] = newRegistry();
 * const remove = register(() => console.log("disposed"));
 * // later…
 * cleanup(); // logs "disposed"
 * ```
 */
export function newRegistry(
	onError: (error: unknown) => void = console.log,
): [register: (cleanup?: () => void) => void, cleanup: () => void] {
	const cleanups = new Set<() => void>();
	function register(cleanup?: () => void): () => void {
		const remove = () => {
			cleanups.delete(remove);
			try {
				cleanup?.();
			} catch (error) {
				onError?.(error);
			}
		};
		cleanups.add(remove);
		return remove;
	}

	function cleanup(): void {
		if (cleanups) {
			const fns = [...cleanups].reverse();
			cleanups.clear();
			for (const fn of fns) {
				fn();
			}
		}
	}

	return [register, cleanup];
}
