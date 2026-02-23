import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { describe, expect, it } from "vitest";
import {
  createHandlerLoader,
  findStateConfig,
} from "@/shared-process/run-process/handler-loader.ts";

const simpleConfig: FsmStateConfig = {
  key: "Root",
  transitions: [
    ["", "*", "A"],
    ["A", "go", "B"],
  ],
  states: [
    {
      key: "A",
      events: { go: "proceed" },
    },
    {
      key: "B",
      events: { done: "finished" },
    },
  ],
};

const nestedConfig: FsmStateConfig = {
  key: "Root",
  transitions: [["", "*", "Parent"]],
  states: [
    {
      key: "Parent",
      transitions: [["", "*", "Child"]],
      states: [
        {
          key: "Child",
          events: { done: "finished" },
        },
      ],
    },
  ],
};

describe("findStateConfig", () => {
  it("finds root config by key", () => {
    const found = findStateConfig(simpleConfig, "Root");
    expect(found).toBe(simpleConfig);
  });

  it("finds child config by key", () => {
    const found = findStateConfig(simpleConfig, "A");
    expect(found?.key).toBe("A");
  });

  it("finds nested config by key", () => {
    const found = findStateConfig(nestedConfig, "Child");
    expect(found?.key).toBe("Child");
  });

  it("returns undefined for unknown key", () => {
    const found = findStateConfig(simpleConfig, "Unknown");
    expect(found).toBeUndefined();
  });
});

describe("createHandlerLoader", () => {
  const defaultHandler = async function* () {
    yield "default";
  };

  it("explicit handler wins over default", () => {
    const myHandler = async function* () {
      yield "custom";
    };
    const loader = createHandlerLoader(
      simpleConfig,
      { A: myHandler },
      defaultHandler,
    );
    const handlers = loader("A", undefined);
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBe(myHandler);
  });

  it("leaf state gets defaultHandler when no explicit handler", () => {
    const loader = createHandlerLoader(simpleConfig, {}, defaultHandler);
    const handlers = loader("A", undefined);
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBe(defaultHandler);
  });

  it("non-leaf state gets empty array when no explicit handler", () => {
    const loader = createHandlerLoader(nestedConfig, {}, defaultHandler);
    const handlers = loader("Parent", undefined);
    expect(handlers).toHaveLength(0);
  });

  it("unknown state gets empty array", () => {
    const loader = createHandlerLoader(simpleConfig, {}, defaultHandler);
    const handlers = loader("NonExistent", undefined);
    expect(handlers).toHaveLength(0);
  });

  it("explicit handler on non-leaf state is returned", () => {
    const parentHandler = async function* () {
      yield "parent";
    };
    const loader = createHandlerLoader(
      nestedConfig,
      { Parent: parentHandler },
      defaultHandler,
    );
    const handlers = loader("Parent", undefined);
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBe(parentHandler);
  });
});
