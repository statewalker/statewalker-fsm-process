export function wrapType<T extends new (...args: any[]) => {}>(Type: T) {
  const NotifyMethodKey = Symbol("notify");
  return class ProxiedType extends Type {
    constructor(...args: any[]) {
      super(...args);
      return new Proxy(this, {
        set: (target, prop, value) => {
          const prevValue = Reflect.get(target, prop);
          Reflect.set(target, prop, value);
          const notify = Reflect.get(target, NotifyMethodKey);
          if (
            prop !== NotifyMethodKey &&
            prevValue !== value &&
            typeof notify === "function"
          ) {
            notify(this, prop, value, prevValue);
          }
          return true;
        },
      });
    }
    $onUpdate(
      onUpdate:
        | undefined
        | ((
            instance: this,
            prop: string | Symbol,
            value: any,
            prevValue: any
          ) => void)
    ) {
      Reflect.set(this, NotifyMethodKey, onUpdate);
    }
  };
}
