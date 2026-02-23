import { newAdapter } from "./new-adapter.ts";

export type ExecutionEvent = {
  timestamp: number;
  type: "enter" | "exit" | "dispatch" | "artifact" | "error";
  statePath: string[];
  event?: string;
  data?: unknown;
};

export const [getHistory, setHistory] = newAdapter<ExecutionEvent[]>(
  "history",
  () => [],
);
