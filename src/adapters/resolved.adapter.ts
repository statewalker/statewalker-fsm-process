import { newAdapter } from "./new-adapter.ts";

export const [getResolved, setResolved] = newAdapter<Record<string, unknown>>(
  "resolved",
  () => ({}),
);
