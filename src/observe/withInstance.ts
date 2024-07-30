import { wrapType } from "./wrapType.ts";

export function withInstance<T extends { toJson: () => D }, D = any>(
  Type: new (data: D) => T
): (data: D, setData: (data: D) => void) => T {
  const ProxiedType = wrapType(Type);
  return function (data: D, setData: (data: D) => void): T {
    const instance = new ProxiedType(data);
    instance.$onUpdate(() => setData(instance.toJson()));
    return instance;
  };
}
