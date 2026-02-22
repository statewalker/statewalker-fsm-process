import { newAdapter } from "../adapters/index.ts";

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
