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
