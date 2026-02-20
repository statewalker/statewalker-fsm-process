import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { serializeConfigHandler } from "../../src/define/handlers/serialize-config.ts";
import { describe, expect, it } from "../deps.ts";
import { lightBulbConfig } from "../fixtures.ts";
import { collectEvents, createDefineContext } from "../helpers.ts";

describe("serializeConfigHandler", () => {
  it("should write YAML file and yield configSerialized", async () => {
    const dir = await mkdtemp(join(tmpdir(), "fsm-serialize-"));
    const outPath = join(dir, "output.yaml");
    try {
      const ctx = createDefineContext({
        params: { output: outPath },
        resolved: { config: lightBulbConfig },
      });

      const { events } = await collectEvents(serializeConfigHandler, ctx);
      expect(events).toEqual(["configSerialized"]);

      const content = await readFile(outPath, "utf-8");
      expect(content).toContain("LightBulb");
      expect(content).toContain("toggle");
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  it("should yield configSerialized when writing to stdout (no output path)", async () => {
    const ctx = createDefineContext({
      params: {},
      resolved: { config: lightBulbConfig },
    });

    // Capture stdout
    const originalWrite = process.stdout.write;
    let output = "";
    process.stdout.write = ((chunk: string) => {
      output += chunk;
      return true;
    }) as typeof process.stdout.write;

    try {
      const { events } = await collectEvents(serializeConfigHandler, ctx);
      expect(events).toEqual(["configSerialized"]);
      expect(output).toContain("LightBulb");
    } finally {
      process.stdout.write = originalWrite;
    }
  });
});
