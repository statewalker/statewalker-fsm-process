import { type Services } from "@statewalker/services";
import { listen } from "@agen/utils";
import { type DependenciesDeclarations } from "./useDependencies.ts";
import { exposeAction } from "./exposeAction.ts";

export type ServiceConfig<S, T extends Record<string, any> = {}> = {
  key: string;
  dependencies?: DependenciesDeclarations<T>;
  service: (
    deps: () => AsyncGenerator<T | undefined>
  ) => AsyncGenerator<S | undefined>;
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
      const close = listen(service(deps), provider);
      return () => {
        close();
        provider.close();
      };
    },
  });
}
