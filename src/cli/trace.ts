import { readFile, writeFile } from "node:fs/promises";
import { ArtifactStore } from "../observe/artifacts.ts";
import { Reporter } from "../observe/reporter.ts";
import type { TraceEntry } from "../observe/tracer.ts";
import type { CliOptions } from "./index.ts";

export async function runTraceCommand(opts: CliOptions): Promise<number> {
  const logPath = opts.positional[0];
  if (!logPath) {
    console.error(
      "Usage: fsm-process trace <execution-log.json> [--format tree|timeline] [--artifacts] [--export chart.json]",
    );
    return 2;
  }

  try {
    const raw = await readFile(logPath, "utf-8");
    const data = JSON.parse(raw) as {
      trace?: TraceEntry[];
      artifacts?: Array<{
        type: "file" | "text" | "json" | "error";
        name: string;
        content: unknown;
        timestamp: number;
        statePath: string[];
      }>;
    };

    const entries: TraceEntry[] =
      data.trace ?? (data as unknown as TraceEntry[]);
    const reporter = new Reporter();
    const format = opts.format ?? "tree";

    if (opts.artifacts) {
      const store = new ArtifactStore();
      if (data.artifacts) {
        for (const a of data.artifacts) {
          store.add(a.statePath, {
            type: a.type,
            name: a.name,
            content: a.content,
            timestamp: a.timestamp,
          });
        }
      }
      reporter.printArtifacts(store);
    } else {
      if (format === "timeline") {
        reporter.printTimeline(entries);
      } else {
        reporter.printTree(entries);
      }
    }

    if (opts.export) {
      const chartEvents = entriesToChartEvents(entries);
      await writeFile(
        opts.export,
        JSON.stringify(chartEvents, null, 2),
        "utf-8",
      );
      console.error(`Chart data exported to ${opts.export}`);
    }

    return 0;
  } catch (err) {
    console.error("Trace failed:", err);
    return 1;
  }
}

function entriesToChartEvents(
  entries: TraceEntry[],
): Array<{ type: string; timestamp: number; stateIds: string[] }> {
  const events: Array<{
    type: string;
    timestamp: number;
    stateIds: string[];
  }> = [];
  for (const entry of entries) {
    if (entry.type === "enter") {
      events.push({
        type: "activate",
        timestamp: entry.timestamp,
        stateIds: [...entry.statePath],
      });
    } else if (entry.type === "exit") {
      events.push({
        type: "deactivate",
        timestamp: entry.timestamp,
        stateIds: [...entry.statePath],
      });
    }
  }
  return events;
}
