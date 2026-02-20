import type { ChartEvent, TraceEntry } from "./tracer.ts";

/**
 * Convert trace entries to a format consumable by @statewalker/fsm-charts.
 *
 * Returns an array of activation events that can drive
 * RuntimeStatechartApi.activateStates().
 */
export function toChartData(entries: TraceEntry[]): ChartEvent[] {
  const events: ChartEvent[] = [];
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

/**
 * Replay chart events against a statechart API-like object.
 *
 * Accepts anything that has activateStates / deactivateStates methods,
 * so it can work with RuntimeStatechartApi or a mock.
 */
export function replayChartEvents(
  events: ChartEvent[],
  api: {
    activateStates?: (...ids: string[]) => void;
    deactivateStates?: (...ids: string[]) => void;
  },
): void {
  for (const event of events) {
    if (event.type === "activate" && api.activateStates) {
      api.activateStates(...event.stateIds);
    } else if (event.type === "deactivate" && api.deactivateStates) {
      api.deactivateStates(...event.stateIds);
    }
  }
}
