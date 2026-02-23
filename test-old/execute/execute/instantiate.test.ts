import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { instantiate } from "../../src/execute/instantiate.ts";
import { describe, expect, it } from "../deps.ts";
import { lightBulbConfig } from "../fixtures.ts";
import { writeTempYaml } from "../helpers.ts";

describe("instantiate", () => {
  it("should accept a FsmStateConfig object directly", async () => {
    const { config, context } = await instantiate({
      template: lightBulbConfig,
      params: { foo: "bar" },
    });

    expect(config.key).toBe("LightBulb");
    expect(context.config).toEqual(config);
    expect(context.params).toEqual({ foo: "bar" });
  });

  it("should load and parse a YAML file path", async () => {
    const { path, cleanup } = await writeTempYaml(lightBulbConfig);
    try {
      const { config, context } = await instantiate({
        template: path,
        params: {},
      });

      expect(config.key).toBe("LightBulb");
      expect(context.config).toBeDefined();
    } finally {
      await cleanup();
    }
  });

  it("should deep clone the config to keep template immutable", async () => {
    const original = structuredClone(lightBulbConfig);
    const { config } = await instantiate({
      template: lightBulbConfig,
      params: {},
    });

    // Mutate the returned config
    config.key = "Mutated";
    expect(lightBulbConfig.key).toBe(original.key);
  });

  it("should set the model on context when provided", async () => {
    const fakeModel = {
      specificationVersion: "v1",
      provider: "test",
      modelId: "test-model",
      defaultObjectGenerationMode: "json",
      doGenerate: async () => ({}),
      doStream: async () => ({}),
    };

    const { context } = await instantiate({
      template: lightBulbConfig,
      params: {},
      model: fakeModel as unknown as import("ai").LanguageModelV1,
    });

    expect(context.model).toBe(fakeModel);
  });

  it("should throw for invalid config", async () => {
    const badConfig = {
      key: "",
      transitions: [["A", "go", "B"]],
    } as FsmStateConfig;

    await expect(
      instantiate({ template: badConfig, params: {} }),
    ).rejects.toThrow("Invalid config");
  });
});
