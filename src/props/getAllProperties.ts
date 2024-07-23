export function getAllProperties<T>(
  self?: T
): Record<string, TypedPropertyDescriptor<any>> {
  let descriptors: Record<string, TypedPropertyDescriptor<any>> = {};
  for (
    let o: object | null = self as any;
    !!o && o !== Object.prototype;
    o = Reflect.getPrototypeOf(o)
  ) {
    for (const [key, descriptor] of Object.entries(
      Object.getOwnPropertyDescriptors(o)
    )) {
      if (key in descriptors) continue;
      descriptors[key] = descriptor;
    }
  }
  return descriptors;
}
