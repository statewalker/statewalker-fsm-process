/**
 * Creates a typed key-value adapter pair for a shared context object.
 *
 * Returns a `[get, set]` tuple that reads/writes a single keyed slot on any
 * `Record<string, unknown>` context. When an optional `create` factory is
 * provided, `get` lazily initialises the slot on first access; without it,
 * `get` throws if the slot is still `undefined`.
 *
 * @template T - The type of the stored value.
 * @param key - Property name used on the context object.
 * @param create - Optional factory invoked once to initialise the slot.
 * @returns `[get, set]` — typed accessors bound to `key`.
 *
 * @example
 * ```ts
 * const [getLogger, setLogger] = newAdapter<Logger>("logger");
 * setLogger(ctx, new ConsoleLogger());
 * getLogger(ctx).info("ready");
 * ```
 *
 * @example
 * ```ts
 * // With lazy factory — value created on first `get`
 * const [getCache] = newAdapter<Map<string, unknown>>("cache", () => new Map());
 * getCache(ctx).set("key", value);
 * ```
 */
export function newAdapter<T>(
  key: string,
  create?: () => T,
): [
  get: (ctx: Record<string, unknown>) => T,
  set: (ctx: Record<string, unknown>, value: T) => void,
] {
  function get(ctx: Record<string, unknown>): T {
    if (ctx[key] === undefined) {
      if (create) {
        ctx[key] = create();
      } else {
        throw new Error(`Adapter "${key}" not found in context`);
      }
    }
    return ctx[key] as T;
  }
  function set(ctx: Record<string, unknown>, value: T): void {
    ctx[key] = value;
  }
  return [get, set];
}
