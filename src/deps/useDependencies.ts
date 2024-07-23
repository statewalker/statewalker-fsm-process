import { type Slot, slot } from "@agen/utils";
import {
  type Cardinality,
  type Services,
  resolveDependencies,
} from "@statewalker/services";

export type DependenciesDeclarations<T> = Record<keyof T, Cardinality>;

export function useDependencies<T extends Record<string, any>, R = T>({
  services,
  dependencies,
  filter = (values: T | undefined): R | undefined => {
    if (!values) return;
    let empty = false;
    const result: Record<string, any> = {};
    for (const [key, [min, max]] of Object.entries(dependencies || {})) {
      const valuesArray = values[key] as [];
      let array = valuesArray.filter((v) => v !== undefined);
      if (array.length < min) {
        empty = true;
        break;
      }
      if (max === 1) {
        result[key] = array[array.length - 1];
      } else {
        result[key] = array;
      }
    }
    return !empty ? (result as R) : undefined;
  },
}: {
  services: Services;
  dependencies?: DependenciesDeclarations<T>;
  filter?: (values: T | undefined) => R | undefined;
}): Slot<R | undefined> {
  const s = slot<R | undefined>();
  const close = resolveDependencies<T>({
    services,
    dependencies,
    activate: (values: T) => {
      s.value = filter(values);
    },
    update: (values: T) => {
      s.value = filter(values);
    },
    deactivate: () => {
      s.value = undefined;
      // s.observer.complete();
    },
  });
  s.promise.finally(close);
  return s;
}
