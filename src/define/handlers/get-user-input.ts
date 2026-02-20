import { readFile } from "node:fs/promises";
import type { StageHandler } from "@statewalker/fsm";
import { newAdapter } from "../../adapter.ts";

const [getParams] = newAdapter<Record<string, unknown>>("params", () => ({}));
const [getResolved] = newAdapter<Record<string, unknown>>(
  "resolved",
  () => ({}),
);

export const getUserInputHandler: StageHandler<Record<string, unknown>> =
  async function* (context) {
    const params = getParams(context);
    const resolved = getResolved(context);

    let description = "";

    const input = params.input as string | undefined;
    const prompt = params.prompt as string | undefined;

    if (input && input !== "-") {
      try {
        description = await readFile(input, "utf-8");
      } catch {
        yield "noInput";
        return;
      }
    } else if (input === "-") {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      description = Buffer.concat(chunks).toString("utf-8");
    } else if (prompt) {
      description = prompt;
    }

    description = description.trim();

    if (!description) {
      yield "noInput";
      return;
    }

    resolved.description = description;
    yield "inputReady";
  };
