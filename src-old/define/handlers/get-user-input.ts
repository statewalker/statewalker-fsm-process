import { readFile } from "node:fs/promises";
import type { StageHandler } from "@statewalker/fsm";
import { getParams } from "../../adapters/params.adapter.ts";
import { getResolved } from "../../adapters/resolved.adapter.ts";
import { readStdin } from "../../cli/pipe.ts";

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
      } catch (err) {
        console.error(`Failed to read input file "${input}":`, err);
        yield "noInput";
        return;
      }
    } else if (input === "-") {
      description = (await readStdin()) ?? "";
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
