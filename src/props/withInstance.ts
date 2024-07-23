import { wrap } from "./wrap.ts";

export function withInstance<D extends Record<string, any>, T extends D>(
  Type: new (data: D) => T
): (data: D, update: (data: D) => void) => T {
  let instance: T;
  return (data: D, update: (data: D) => void) =>
    wrap(
      (instance = instance || new Type(data)),
      (field) => data[field],
      (field, value) => {
        data = { ...data, [field]: value };
        update(data);
      }
    );
}
