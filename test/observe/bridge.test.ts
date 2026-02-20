import { replayChartEvents, toChartData } from "../../src/observe/bridge.ts";
import type { TraceEntry } from "../../src/observe/tracer.ts";
import { describe, expect, it } from "../deps.ts";

function sampleEntries(): TraceEntry[] {
  return [
    {
      timestamp: 1000,
      depth: 0,
      type: "enter",
      statePath: ["Root"],
      stateKey: "Root",
    },
    {
      timestamp: 1010,
      depth: 1,
      type: "enter",
      statePath: ["Root", "Step"],
      stateKey: "Step",
    },
    {
      timestamp: 1100,
      depth: 1,
      type: "exit",
      statePath: ["Root", "Step"],
      stateKey: "Step",
      duration: 90,
    },
    {
      timestamp: 1110,
      depth: 1,
      type: "dispatch",
      statePath: ["Root"],
      stateKey: "Root",
      event: "done",
    },
    {
      timestamp: 1200,
      depth: 0,
      type: "exit",
      statePath: ["Root"],
      stateKey: "Root",
      duration: 200,
    },
  ];
}

describe("toChartData", () => {
  it("should convert enter/exit entries to activate/deactivate events", () => {
    const events = toChartData(sampleEntries());

    expect(events).toHaveLength(4);
    expect(events[0]).toEqual({
      type: "activate",
      timestamp: 1000,
      stateIds: ["Root"],
    });
    expect(events[1]).toEqual({
      type: "activate",
      timestamp: 1010,
      stateIds: ["Root", "Step"],
    });
    expect(events[2]).toEqual({
      type: "deactivate",
      timestamp: 1100,
      stateIds: ["Root", "Step"],
    });
    expect(events[3]).toEqual({
      type: "deactivate",
      timestamp: 1200,
      stateIds: ["Root"],
    });
  });

  it("should ignore dispatch entries", () => {
    const events = toChartData(sampleEntries());
    const hasDispatch = events.some(
      (e) => e.type !== "activate" && e.type !== "deactivate",
    );
    expect(hasDispatch).toBe(false);
  });

  it("should return empty array for empty entries", () => {
    expect(toChartData([])).toEqual([]);
  });
});

describe("replayChartEvents", () => {
  it("should call activateStates for activate events", () => {
    const activated: string[][] = [];
    const api = {
      activateStates: (...ids: string[]) => activated.push(ids),
    };

    replayChartEvents(
      [{ type: "activate", timestamp: 0, stateIds: ["Root", "A"] }],
      api,
    );

    expect(activated).toEqual([["Root", "A"]]);
  });

  it("should call deactivateStates for deactivate events", () => {
    const deactivated: string[][] = [];
    const api = {
      deactivateStates: (...ids: string[]) => deactivated.push(ids),
    };

    replayChartEvents(
      [{ type: "deactivate", timestamp: 0, stateIds: ["Root"] }],
      api,
    );

    expect(deactivated).toEqual([["Root"]]);
  });

  it("should handle api without optional methods", () => {
    // Should not throw
    replayChartEvents(
      [
        { type: "activate", timestamp: 0, stateIds: ["A"] },
        { type: "deactivate", timestamp: 1, stateIds: ["A"] },
      ],
      {},
    );
  });
});
