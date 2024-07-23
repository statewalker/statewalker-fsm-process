import { type Services } from "@statewalker/services";
import {
  type DependenciesDeclarations,
  useDependencies,
} from "./useDependencies.ts";

export type ActionConfig<T> = {
  dependencies?: DependenciesDeclarations<T>;
  action: (deps: () => AsyncGenerator<T | undefined>) => (() => void) | unknown;
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
  const close = action(deps);
  return (typeof close === "function" ? close : () => {}) as () => void;
}
