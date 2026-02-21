import type { Tracer } from "../observe/tracer.ts";
import { newAdapter } from "./new-adapter.ts";

export const [getTracer, setTracer] = newAdapter<Tracer | undefined>("tracer");
