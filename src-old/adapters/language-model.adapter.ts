import type { LanguageModelV1 } from "ai";
import { newAdapter } from "./new-adapter.ts";

export const [getModel, setModel] = newAdapter<LanguageModelV1>("model");
