import { newAdapter } from "./new-adapter.ts";

export const [getParams, setParams] = newAdapter<Record<string, unknown>>(
  "params",
  () => ({}),
);
