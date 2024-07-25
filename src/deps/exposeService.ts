import { type Services } from "@statewalker/services";
import { type DependenciesDeclarations } from "./useDependencies.ts";
import { exposeAction } from "./exposeAction.ts";
import { listen } from "@agen/utils";

export type ServiceConfig<S, T extends Record<string, any> = {}> = {
  key: string;
  dependencies?: DependenciesDeclarations<T>;
  service: (
    deps: AsyncGenerator<T | undefined>
  ) => AsyncIterable<S | undefined>;
};
export function exposeService<S, T extends Record<string, any> = {}>({
  services,
  dependencies,
  key,
  service,
}: ServiceConfig<S, T> & {
  services: Services;
}): () => void {
  return exposeAction({
    services,
    dependencies,
    action: (deps) => {
      const provider = services.newProvider<S | undefined>(key);
      const unsubscribe = listen(service(deps), provider)
      return () => {
        unsubscribe();
        provider.close();
      }
    },
  });
}
