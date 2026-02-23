import { describe, expect, it } from "vitest";
import {
  type Logger,
  getLogger,
  getProcessId,
  getRootLogger,
  newConsoleLogger,
  setLogger,
} from "@/shared/logger/logger";

describe("newConsoleLogger", () => {
  it("returns a Logger with all required methods", () => {
    const logger = newConsoleLogger();
    expect(typeof logger.fatal).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.trace).toBe("function");
    expect(typeof logger.child).toBe("function");
    expect(logger.level).toBe("info");
  });

  it("child returns a Logger", () => {
    const logger = newConsoleLogger();
    const child = logger.child({ module: "test" });
    expect(typeof child.info).toBe("function");
    expect(typeof child.child).toBe("function");
  });

  it("respects log level setting", () => {
    const logger = newConsoleLogger("error");
    expect(logger.level).toBe("error");
  });

  it("level can be changed", () => {
    const logger = newConsoleLogger("info");
    logger.level = "debug";
    expect(logger.level).toBe("debug");
  });

  it("rejects unknown log level", () => {
    const logger = newConsoleLogger("info");
    expect(() => {
      (logger as Logger).level = "unknown" as never;
    }).toThrow("Unknown log level");
  });
});

describe("getProcessId", () => {
  it("returns a string", () => {
    const ctx: Record<string, unknown> = {};
    const id = getProcessId(ctx);
    expect(typeof id).toBe("string");
  });

  it("returns same id for same context", () => {
    const ctx: Record<string, unknown> = {};
    expect(getProcessId(ctx)).toBe(getProcessId(ctx));
  });

  it("different contexts get different ids", () => {
    const ctx1: Record<string, unknown> = {};
    const ctx2: Record<string, unknown> = {};
    expect(getProcessId(ctx1)).not.toBe(getProcessId(ctx2));
  });
});

describe("getRootLogger / setLogger / getLogger", () => {
  it("setLogger stores and getRootLogger retrieves", () => {
    const ctx: Record<string, unknown> = {};
    const mock: Logger = {
      level: "info",
      fatal: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
      trace: () => {},
      child() {
        return this;
      },
    };
    setLogger(ctx, mock);
    expect(getRootLogger(ctx)).toBe(mock);
  });

  it("getLogger returns a child logger", () => {
    const ctx: Record<string, unknown> = {};
    const children: Record<string, unknown>[] = [];
    const mock: Logger = {
      level: "info",
      fatal: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
      trace: () => {},
      child(metadata) {
        children.push(metadata);
        return this;
      },
    };
    setLogger(ctx, mock);
    ctx["fsm:states"] = ["A"];
    ctx["fsm:event"] = "go";
    getLogger(ctx);
    expect(children.length).toBeGreaterThan(0);
  });

  it("getRootLogger creates default logger when none set", () => {
    const ctx: Record<string, unknown> = {};
    const logger = getRootLogger(ctx);
    expect(typeof logger.info).toBe("function");
  });
});
