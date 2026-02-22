/**
 * Minimal observable base class.
 *
 * Provides a subscribe/notify mechanism for model objects. Subclasses call
 * {@link BaseClass.notify | notify()} after mutating their state; external
 * consumers register callbacks via {@link BaseClass.onUpdate | onUpdate()}.
 *
 * Listeners are stored in a `Set`, so the same function reference is
 * deduplicated (subscribed at most once).
 *
 * @example
 * ```ts
 * class Counter extends BaseClass {
 *   value = 0;
 *   increment() { this.value++; this.notify(); }
 * }
 * const c = new Counter();
 * const unsub = c.onUpdate(() => console.log(c.value));
 * c.increment(); // logs 1
 * unsub();
 * ```
 */
export class BaseClass {
	private _listeners: Set<() => void> = new Set();

	/**
	 * Registers a listener that is called on every {@link notify}.
	 *
	 * @param callback - Function invoked synchronously when the object changes.
	 * @returns An unsubscribe function that removes the listener.
	 */
	onUpdate(callback: () => void): () => void {
		this._listeners.add(callback);
		return () => {
			this._listeners.delete(callback);
		};
	}

	/** Synchronously invokes all registered listeners. */
	notify(): void {
		for (const listener of this._listeners) {
			listener();
		}
	}
}
