import { ArtifactStore } from "../../src/observe/artifacts.ts";
import { Reporter } from "../../src/observe/reporter.ts";
import type { TraceEntry } from "../../src/observe/tracer.ts";
import { describe, expect, it } from "../deps.ts";

function createEntries(): TraceEntry[] {
  const base = 1000000;
  return [
    {
      timestamp: base,
      depth: 0,
      type: "enter",
      statePath: ["Root"],
      stateKey: "Root",
    },
    {
      timestamp: base + 10,
      depth: 1,
      type: "enter",
      statePath: ["Root", "Step"],
      stateKey: "Step",
    },
    {
      timestamp: base + 100,
      depth: 1,
      type: "exit",
      statePath: ["Root", "Step"],
      stateKey: "Step",
      duration: 90,
    },
    {
      timestamp: base + 110,
      depth: 1,
      type: "dispatch",
      statePath: ["Root"],
      stateKey: "Root",
      event: "done",
    },
    {
      timestamp: base + 200,
      depth: 0,
      type: "exit",
      statePath: ["Root"],
      stateKey: "Root",
      duration: 200,
    },
  ];
}

describe("Reporter", () => {
  describe("printTree", () => {
    it("should print hierarchical tree with durations", () => {
      const lines: string[] = [];
      const reporter = new Reporter((line) => lines.push(line));

      reporter.printTree(createEntries());

      expect(lines.length).toBeGreaterThanOrEqual(2);
      expect(lines[0]).toContain("Root");
      expect(lines[1]).toContain("Step");
      expect(lines[1]).toContain("90ms");
    });
  });

  describe("printTimeline", () => {
    it("should print chronological timeline", () => {
      const lines: string[] = [];
      const reporter = new Reporter((line) => lines.push(line));

      reporter.printTimeline(createEntries());

      expect(lines).toHaveLength(5);
      expect(lines[0]).toContain("enter");
      expect(lines[0]).toContain("Root");
      // Timeline includes arrows
      expect(lines[0]).toContain("▶");
      expect(lines[4]).toContain("◀");
    });

    it("should show dispatch events with lightning symbol", () => {
      const lines: string[] = [];
      const reporter = new Reporter((line) => lines.push(line));

      reporter.printTimeline(createEntries());

      const dispatchLine = lines.find((l) => l.includes("dispatch"));
      expect(dispatchLine).toContain("⚡");
      expect(dispatchLine).toContain("done");
    });
  });

  describe("printArtifacts", () => {
    it("should print artifacts grouped by state", () => {
      const lines: string[] = [];
      const reporter = new Reporter((line) => lines.push(line));

      const store = new ArtifactStore();
      store.add(["Root", "Step"], {
        type: "text",
        name: "result",
        content: "hello world",
        timestamp: 1000,
      });

      reporter.printArtifacts(store);

      expect(lines.some((l) => l.includes("Root > Step"))).toBe(true);
      expect(lines.some((l) => l.includes("[text] result"))).toBe(true);
      expect(lines.some((l) => l.includes("hello world"))).toBe(true);
    });

    it("should print message when no artifacts exist", () => {
      const lines: string[] = [];
      const reporter = new Reporter((line) => lines.push(line));

      reporter.printArtifacts(new ArtifactStore());

      expect(lines).toEqual(["No artifacts collected."]);
    });
  });
});
