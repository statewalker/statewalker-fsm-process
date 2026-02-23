import type { ArtifactStore } from "./artifacts.ts";
import type { TraceEntry } from "./tracer.ts";

export class Reporter {
  private output: (line: string) => void;

  constructor(output?: (line: string) => void) {
    this.output = output ?? ((line) => console.log(line));
  }

  printTree(entries: TraceEntry[]): void {
    const exitDurations = new Map<string, number>();

    // First pass: collect exit durations
    for (const entry of entries) {
      if (entry.type === "exit" && entry.duration !== undefined) {
        exitDurations.set(entry.statePath.join("."), entry.duration);
      }
    }

    // Second pass: print tree from enter entries
    const printed = new Set<string>();
    for (const entry of entries) {
      if (entry.type !== "enter") continue;

      const pathKey = entry.statePath.join(".");
      if (printed.has(pathKey)) continue;
      printed.add(pathKey);

      const indent = entry.depth;
      const prefix = indent > 0 ? `${"│  ".repeat(indent - 1)}├─ ` : "";
      const duration = exitDurations.get(pathKey);
      const durationStr =
        duration !== undefined ? ` (${formatDuration(duration)})` : "";

      // Find the dispatch event that follows this state's exit
      const exitIdx = entries.findIndex(
        (e) => e.type === "exit" && e.statePath.join(".") === pathKey,
      );
      let eventStr = "";
      if (exitIdx >= 0) {
        const nextDispatch = entries
          .slice(exitIdx)
          .find((e) => e.type === "dispatch" && e.depth <= entry.depth);
        if (nextDispatch?.event) {
          eventStr = ` → ${nextDispatch.event}`;
        }
      }

      this.output(`${prefix}${entry.stateKey}${durationStr}${eventStr}`);
    }
  }

  printTimeline(entries: TraceEntry[]): void {
    const baseTime = entries.length > 0 ? entries[0].timestamp : 0;

    for (const entry of entries) {
      const offset = entry.timestamp - baseTime;
      const time = `[${formatDuration(offset)}]`.padEnd(12);
      const indent = "  ".repeat(entry.depth);
      const arrow =
        entry.type === "enter"
          ? "▶"
          : entry.type === "exit"
            ? "◀"
            : entry.type === "dispatch"
              ? "⚡"
              : entry.type === "artifact"
                ? "📎"
                : "⚠";
      const event = entry.event ? ` (${entry.event})` : "";
      const duration =
        entry.type === "exit" && entry.duration !== undefined
          ? ` [${formatDuration(entry.duration)}]`
          : "";

      this.output(
        `${time}${indent}${arrow} ${entry.type} ${entry.stateKey}${event}${duration}`,
      );
    }
  }

  printArtifacts(store: ArtifactStore): void {
    const artifacts = store.all();
    if (artifacts.length === 0) {
      this.output("No artifacts collected.");
      return;
    }

    // Group by state path
    const byState = new Map<string, typeof artifacts>();
    for (const a of artifacts) {
      const key = a.statePath.join(" > ");
      const list = byState.get(key) ?? [];
      list.push(a);
      byState.set(key, list);
    }

    for (const [path, items] of byState) {
      this.output(`\n${path}:`);
      for (const item of items) {
        const preview =
          typeof item.content === "string"
            ? item.content.slice(0, 80)
            : JSON.stringify(item.content).slice(0, 80);
        this.output(`  [${item.type}] ${item.name}: ${preview}`);
      }
    }
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const remaining = s % 60;
  return `${m}m${remaining.toFixed(0)}s`;
}
