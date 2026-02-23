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
 * type Cache = Map<string, unknown>;
 * const [getCache] = newAdapter<Cache>("cache", () => new Map());
 * getCache(ctx).set("key", value);
 * ```
 */
export function newAdapter<
  T,
  C extends Record<string, unknown> = Record<string, unknown>,
>(
  key: string,
  create?: (ctx: C) => T,
): [
  get: (ctx: C) => T,
  set: (ctx: C, value: T) => void,
  remove: (ctx: C) => void,
] {
  function get(ctx: C): T {
    if (ctx[key] === undefined) {
      if (create) {
        set(ctx, create(ctx));
      } else {
        throw new Error(`Adapter "${key}" not found in context`);
      }
    }
    return ctx[key] as T;
  }
  function set(ctx: C, value: T): void {
    (ctx as Record<string, unknown>)[key] = value;
  }
  function remove(ctx: C): void {
    delete (ctx as Record<string, unknown>)[key];
  }
  return [get, set, remove];
}
