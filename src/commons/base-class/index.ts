export class BaseClass {
	private _listeners: Set<() => void> = new Set();

	onUpdate(callback: () => void): () => void {
		this._listeners.add(callback);
		return () => {
			this._listeners.delete(callback);
		};
	}

	notify(): void {
		for (const listener of this._listeners) {
			listener();
		}
	}
}
