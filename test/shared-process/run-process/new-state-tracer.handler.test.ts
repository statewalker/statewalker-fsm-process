import { describe, expect, it } from "vitest";
import { setLogger } from "@/shared/logger/index.ts";
import { newStateTracer } from "@/shared-process/run-process/new-state-tracer.handler";

function mockLogger() {
  const logs: string[] = [];
  const logger = {
    level: "trace" as const,
    fatal: (...args: unknown[]) => logs.push(`fatal:${args.join(" ")}`),
    error: (...args: unknown[]) => logs.push(`error:${args.join(" ")}`),
    warn: (...args: unknown[]) => logs.push(`warn:${args.join(" ")}`),
    info: (...args: unknown[]) => logs.push(`info:${args.join(" ")}`),
    debug: (...args: unknown[]) => logs.push(`debug:${args.join(" ")}`),
    trace: (...args: unknown[]) => logs.push(`trace:${args.join(" ")}`),
    child() {
      return this;
    },
  };
  return { logger, logs };
}

describe("newStateTracer", () => {
  it("returns a StageHandler function", () => {
    const tracer = newStateTracer();
    expect(typeof tracer).toBe("function");
  });

  it("logs state entry and exit", async () => {
    const { logger, logs } = mockLogger();
    const ctx: Record<string, unknown> = {};
    setLogger(ctx, logger);
    ctx["fsm:states"] = ["Root", "Child"];
    ctx["fsm:event"] = "go";

    const tracer = newStateTracer("info");
    const cleanup = await tracer(ctx);
    expect(typeof cleanup).toBe("function");

    const entryLog = logs.find((l) => l.includes("<Child"));
    expect(entryLog).toBeDefined();

    if (typeof cleanup === "function") cleanup();

    const exitLog = logs.find((l) => l.includes("</Child"));
    expect(exitLog).toBeDefined();
  });

  it("uses the specified log level", async () => {
    const { logger, logs } = mockLogger();
    const ctx: Record<string, unknown> = {};
    setLogger(ctx, logger);
    ctx["fsm:states"] = ["A"];
    ctx["fsm:event"] = null;

    const tracer = newStateTracer("debug");
    const cleanup = await tracer(ctx);
    expect(logs.some((l) => l.startsWith("debug:"))).toBe(true);

    if (typeof cleanup === "function") cleanup();
    expect(logs.filter((l) => l.startsWith("debug:")).length).toBe(2);
  });
});
