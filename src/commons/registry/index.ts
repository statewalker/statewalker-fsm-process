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
