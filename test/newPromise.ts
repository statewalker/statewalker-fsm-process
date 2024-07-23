export function newPromise(): [promise: Promise<void>, resolve: () => void] {
  let resolve: () => unknown = () => {};
  const promise = new Promise<void>((r) => (resolve = r));
  return [promise, resolve];
}
