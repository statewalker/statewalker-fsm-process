import { newAdapter } from "./new-adapter.ts";

export type Logger = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
};

export const [getLogger, setLogger] = newAdapter<Logger>(
  "fsm:tracker",
  () => console,
);
