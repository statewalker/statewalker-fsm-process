import { setGenerateObject } from "../../src/define/context.ts";
import { runDefine } from "../../src/define/run.ts";
import { describe, expect, it } from "../deps.ts";
import { lightBulbConfig } from "../fixtures.ts";
import { mockGenerateObject, writeTempFile } from "../helpers.ts";

describe("runDefine", () => {
  it("should run happy path: input → generate → validate → serialize", async () => {
    const { path: inputPath, cleanup } = await writeTempFile(
      "A simple light bulb process",
    );
    try {
      const output: string[] = [];
      const originalWrite = process.stdout.write;
      process.stdout.write = ((chunk: string) => {
        output.push(chunk);
        return true;
      }) as typeof process.stdout.write;

      const ctx: Record<string, unknown> = {
        params: { input: inputPath },
        resolved: {},
      };

      setGenerateObject(
        ctx,
        mockGenerateObject([lightBulbConfig, { incoherencies: [] }]),
      );

      try {
        const { done } = await runDefine(ctx);
        await done;
        expect(output.join("")).toContain("LightBulb");
      } finally {
        process.stdout.write = originalWrite;
      }
    } finally {
      await cleanup();
    }
  });

  it("should exit on noInput", async () => {
    const ctx: Record<string, unknown> = {
      params: {},
      resolved: {},
    };
    setGenerateObject(ctx, mockGenerateObject([]));

    const { done } = await runDefine(ctx);
    await done;
    // Process completes without error
  });

  it("should handle refinement loop", async () => {
    const { path: inputPath, cleanup } = await writeTempFile("A workflow");
    try {
      const output: string[] = [];
      const originalWrite = process.stdout.write;
      process.stdout.write = ((chunk: string) => {
        output.push(chunk);
        return true;
      }) as typeof process.stdout.write;

      let callCount = 0;
      const ctx: Record<string, unknown> = {
        params: { input: inputPath },
        resolved: {},
      };

      setGenerateObject(ctx, async () => {
        callCount++;
        if (callCount === 1) {
          // GenerateInitialConfig
          return { object: lightBulbConfig };
        }
        if (callCount === 2) {
          // ValidateProcessConfig - fail
          return {
            object: {
              incoherencies: [
                { rule: "M9", statePath: "Root", issue: "Bad goal" },
              ],
            },
          };
        }
        if (callCount === 3) {
          // RefineProcessConfig
          return { object: lightBulbConfig };
        }
        // ValidateProcessConfig - pass
        return { object: { incoherencies: [] } };
      });

      try {
        const { done } = await runDefine(ctx);
        await done;
        expect(callCount).toBeGreaterThanOrEqual(4);
      } finally {
        process.stdout.write = originalWrite;
      }
    } finally {
      await cleanup();
    }
  });
});
