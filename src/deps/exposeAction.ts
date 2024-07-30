import { type Services } from "@statewalker/services";
import {
  type DependenciesDeclarations,
  useDependencies,
} from "./useDependencies.ts";

export type ActionConfig<T> = {
  dependencies?: DependenciesDeclarations<T>;
  action: (
    deps: () => AsyncGenerator<T | undefined>
  ) => (() => unknown) | unknown | Promise<unknown | (() => unknown)>;
};
export function exposeAction<T extends Record<string, any>>({
  services,
  dependencies,
  action,
}: ActionConfig<T> & {
  services: Services;
}): () => void {
  const deps = useDependencies<T>({
    services,
    dependencies,
  });
  const promise = Promise.resolve().then(() => action(deps));
  return () => {
    deps.observer.complete();
    promise.then((close) => {
      if (typeof close === "function") {
        close();
      }
    });
  };
}
