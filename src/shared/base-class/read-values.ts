/**
 * Utility function transforming a sync callback notification to an async generator of values provided by the specified function.
 *
 * @param onUpdate A function that registers a callback to be called whenever the object updates. It returns a cleanup function to unregister the callback.
 * @param read A function that returns a value to yield.
 * It is called whenever the update notification is received, and its result is yielded if it is not undefined.
 * @returns An async generator that yields provided values.
 */
export async function* readValues<R>(
  onUpdate: (callback: () => void) => () => void,
  read: () => R | undefined,
): AsyncGenerator<R> {
  let cleanup = () => {};
  try {
    while (true) {
      cleanup();
      const result = read();
      if (result !== undefined) {
        yield result;
      }
      await new Promise<void>((resolve) => {
        cleanup = onUpdate(resolve);
      });
    }
  } finally {
    cleanup();
  }
}
