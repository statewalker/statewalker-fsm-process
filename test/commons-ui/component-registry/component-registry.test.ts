import { describe, it, expect, vi } from "vitest";
import { createComponentRegistry } from "../../../src/commons-ui/component-registry/index.ts";

class ModelA {
  value = 1;
}
class ModelB {
  label = "hello";
}

describe("createComponentRegistry", () => {
  it("register + resolve returns factory result", () => {
    const registry = createComponentRegistry<string>();
    registry.register(ModelA, (model) => `a:${model.value}`);

    const result = registry.resolve(new ModelA());
    expect(result).toBe("a:1");
  });

  it("resolve throws for unregistered model type", () => {
    const registry = createComponentRegistry<string>();

    expect(() => registry.resolve(new ModelA())).toThrow(
      "No renderer registered for ModelA",
    );
  });

  it("registering same type twice overwrites (last wins)", () => {
    const registry = createComponentRegistry<number>();
    registry.register(ModelA, () => 1);
    registry.register(ModelA, () => 2);

    expect(registry.resolve(new ModelA())).toBe(2);
  });

  it("multiple model types are resolved independently", () => {
    const registry = createComponentRegistry<string>();
    registry.register(ModelA, (m) => `a:${m.value}`);
    registry.register(ModelB, (m) => `b:${m.label}`);

    expect(registry.resolve(new ModelA())).toBe("a:1");
    expect(registry.resolve(new ModelB())).toBe("b:hello");
  });

  it("factory is called on every resolve (no caching)", () => {
    const factory = vi.fn((m: ModelA) => m.value);
    const registry = createComponentRegistry<number>();
    registry.register(ModelA, factory);

    const model = new ModelA();
    registry.resolve(model);
    registry.resolve(model);

    expect(factory).toHaveBeenCalledTimes(2);
    expect(factory).toHaveBeenCalledWith(model);
  });
});
