import { writeFile } from "node:fs/promises";
import type { StageHandler } from "@statewalker/fsm";
import { stringify } from "yaml";
import { getParams } from "../../adapters/params.adapter.ts";
import { getResolved } from "../../adapters/resolved.adapter.ts";

export const serializeConfigHandler: StageHandler<Record<string, unknown>> =
  async function* (context) {
    const params = getParams(context);
    const resolved = getResolved(context);
    const config = resolved.config as Record<string, unknown>;
    const output = params.output as string;

    const yamlContent = stringify(config);

    try {
      if (output) {
        await writeFile(output, yamlContent, "utf-8");
        console.log(`Config written to ${output} (key: ${config.key})`);
      } else {
        process.stdout.write(yamlContent);
      }
      yield "configSerialized";
    } catch (err) {
      resolved.error = err;
      yield "serializationFailed";
    }
  };
