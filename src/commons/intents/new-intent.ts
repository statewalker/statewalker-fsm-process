import type { Intent, IntentHandler, Intents } from "./types.ts";

/**
 * Creates a typed intent adapter — a `[run, handle]` pair bound to a key.
 *
 * Mirrors the `newUserAction` pattern: the returned `run` dispatches the
 * intent on an {@link Intents} instance and `handle` registers a handler on it.
 * Both are fully typed by `P` (payload) and `R` (result).
 *
 * @template P - Payload type sent with the intent.
 * @template R - Result type resolved by the handler.
 * @param key - Unique intent key (e.g. `"dialog:confirm"`).
 * @returns `[run, handle]`
 *   - `run(intents, payload)` — dispatches the intent; returns an {@link Intent}.
 *   - `handle(intents, handler)` — registers a handler; returns an unsubscribe function.
 *
 * @example
 * ```ts
 * const [runConfirm, handleConfirm] =
 *   newIntent<{ message: string }, boolean>("dialog:confirm");
 *
 * handleConfirm(intents, (intent) => {
 *   intent.resolve(window.confirm(intent.payload.message));
 *   return true;
 * });
 *
 * const result = runConfirm(intents, { message: "Delete?" });
 * if (await result.promise) { … }
 * ```
 */
export function newIntent<P, R>(
  key: string,
): [
  run: (intents: Intents, payload: P) => Intent<P, R>,
  handle: (intents: Intents, handler: IntentHandler<P, R>) => () => void,
] {
  function run(intents: Intents, payload: P): Intent<P, R> {
    return intents.run<P, R>(key, payload);
  }

  function handle(intents: Intents, handler: IntentHandler<P, R>): () => void {
    return intents.addHandler<P, R>(key, handler);
  }

  return [run, handle];
}
