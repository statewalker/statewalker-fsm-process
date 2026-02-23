import { newAdapter } from "@/shared/adapters/index.ts";

export const [getParams, setParams] = newAdapter<Record<string, unknown>>(
  "params",
  () => ({}),
);
