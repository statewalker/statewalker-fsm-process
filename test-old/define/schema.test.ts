import { fsmStateConfigSchema } from "../../src/define/schema.ts";
import { describe, expect, it } from "../deps.ts";

describe("fsmStateConfigSchema", () => {
  it("should parse minimal config (key only)", () => {
    const result = fsmStateConfigSchema.parse({ key: "Foo" });
    expect(result.key).toBe("Foo");
  });

  it("should parse complete config with nested states", () => {
    const result = fsmStateConfigSchema.parse({
      key: "Main",
      description: "A process",
      outcome: "Done",
      events: { start: "Begin" },
      transitions: [["", "*", "StepA"]],
      states: [
        {
          key: "StepA",
          events: { done: "Finished" },
        },
      ],
      actors: ["User"],
      object: "Task",
    });
    expect(result.key).toBe("Main");
    expect(result.states).toHaveLength(1);
    expect(result.states[0].key).toBe("StepA");
  });

  it("should parse deeply nested configs (3 levels)", () => {
    const result = fsmStateConfigSchema.parse({
      key: "Root",
      states: [
        {
          key: "L1",
          states: [
            {
              key: "L2",
              states: [{ key: "L3" }],
            },
          ],
        },
      ],
    });
    expect(result.states[0].states[0].states[0].key).toBe("L3");
  });

  it("should reject config without key", () => {
    expect(() => fsmStateConfigSchema.parse({})).toThrow();
  });

  it("should parse transitions as 3-tuples", () => {
    const result = fsmStateConfigSchema.parse({
      key: "X",
      transitions: [
        ["A", "evt", "B"],
        ["", "*", "A"],
      ],
    });
    expect(result.transitions).toHaveLength(2);
    expect(result.transitions[0]).toEqual(["A", "evt", "B"]);
  });

  it("should reject transitions with wrong arity", () => {
    expect(() =>
      fsmStateConfigSchema.parse({
        key: "X",
        transitions: [["A", "evt"]],
      }),
    ).toThrow();
  });

  it("should preserve optional metadata fields", () => {
    const result = fsmStateConfigSchema.parse({
      key: "X",
      name: "Display Name",
      description: "desc",
      outcome: "out",
      actors: ["A", "B"],
      object: "Thing",
    });
    expect(result.name).toBe("Display Name");
    expect(result.description).toBe("desc");
    expect(result.outcome).toBe("out");
    expect(result.actors).toEqual(["A", "B"]);
    expect(result.object).toBe("Thing");
  });
});
