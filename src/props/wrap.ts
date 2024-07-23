import { getAllProperties } from "./getAllProperties.ts";

export function wrap<T extends Record<string, any>>(
  instance: T,
  get: <D>(field: string) => D,
  set: <D>(field: string, value: D) => void
): T {
  const props = getAllProperties<T>(instance);
  for (const [field, descriptor] of Object.entries(props)) {
    if (descriptor.get) continue;
    if (typeof descriptor.value === "function") continue;
    set(field, descriptor.value);
    Object.defineProperty(instance, field, {
      get: () => get(field),
      set: (value) => set(field, value),
    });
  }
  return instance;
}
