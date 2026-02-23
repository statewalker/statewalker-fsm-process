import { newAdapter } from "@/commons/adapters/index.ts";

export const [getParams, setParams] = newAdapter<Record<string, unknown>>(
  "params",
  () => ({}),
);
