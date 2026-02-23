/**
 * Stage — keyed pub/sub registry for model collections.
 *
 * A Stage stores published models by key and notifies listeners when models
 * are added. Listeners registered after models are already published receive
 * the current snapshot immediately. The Stage instance is auto-created per
 * context object via an adapter with a lazy factory.
 *
 * Consumers interact through {@link newStageSlot} which returns a typed
 * `[publish, listen]` pair bound to a specific key.
 *
 * @module
 */
import { newAdapter } from "@/commons/adapters/index.ts";

/** @internal */
class Stage {
  private _models: Map<string, unknown[]> = new Map();
  private _listeners: Map<string, Set<(models: unknown[]) => void>> = new Map();

  publish(key: string, model: unknown): () => void {
    let models = this._models.get(key);
    if (!models) {
      models = [];
      this._models.set(key, models);
    }
    models.push(model);

    const listeners = this._listeners.get(key);
    if (listeners) {
      for (const listener of listeners) {
        listener(models);
      }
    }

    return () => {
      const arr = this._models.get(key);
      if (arr) {
        const idx = arr.indexOf(model);
        if (idx !== -1) {
          arr.splice(idx, 1);
        }
      }
    };
  }

  listen(key: string, callback: (models: unknown[]) => void): () => void {
    let listeners = this._listeners.get(key);
    if (!listeners) {
      listeners = new Set();
      this._listeners.set(key, listeners);
    }
    listeners.add(callback);

    const existing = this._models.get(key);
    if (existing && existing.length > 0) {
      callback(existing);
    }

    return () => {
      listeners.delete(callback);
    };
  }

  getAll(key: string): unknown[] {
    return [...(this._models.get(key) ?? [])];
  }
}

const [getStage] = newAdapter<Stage>("stage", () => new Stage());

/**
 * Creates a typed stage slot — a `[publish, listen]` pair for a given key.
 *
 * - **publish(context, model)** — adds `model` to the slot and synchronously
 *   notifies all current listeners with the full model array. Returns an
 *   `unpublish` function that removes the model.
 * - **listen(context, callback)** — registers `callback`; if models are already
 *   published, fires immediately with the current snapshot. Returns an
 *   `unlisten` function.
 *
 * The underlying `Stage` is auto-created per context via adapter factory.
 *
 * @template T - The model type stored in this slot.
 * @param key - Unique key identifying the slot within a Stage.
 * @returns `[publish, listen]` — typed accessors for the slot.
 *
 * @example
 * ```ts
 * const [publishView, listenViews] = newStageSlot<ViewDescriptor>("views");
 * const ctx: Record<string, unknown> = {};
 * const unpublish = publishView(ctx, myView);
 * listenViews(ctx, (views) => console.log("views:", views));
 * ```
 */
export function newStageSlot<T>(
  key: string,
): [
  publish: (context: Record<string, unknown>, model: T) => () => void,
  listen: (
    context: Record<string, unknown>,
    callback: (models: T[]) => void,
  ) => () => void,
] {
  function publish(context: Record<string, unknown>, model: T): () => void {
    const stage = getStage(context);
    return stage.publish(key, model);
  }
  function listen(
    context: Record<string, unknown>,
    callback: (models: T[]) => void,
  ): () => void {
    const stage = getStage(context);
    return stage.listen(key, callback as (models: unknown[]) => void);
  }
  return [publish, listen];
}
