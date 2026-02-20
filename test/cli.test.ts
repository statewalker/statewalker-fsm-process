import { parseCli, parseModelString } from "../src/cli/index.ts";
import { describe, expect, it } from "./deps.ts";

describe("parseCli", () => {
  it("should parse command from first positional", () => {
    const opts = parseCli(["define"]);
    expect(opts.command).toBe("define");
    expect(opts.positional).toEqual([]);
  });

  it("should parse --input and --output flags", () => {
    const opts = parseCli([
      "define",
      "--input",
      "desc.txt",
      "--output",
      "out.yaml",
    ]);
    expect(opts.command).toBe("define");
    expect(opts.input).toBe("desc.txt");
    expect(opts.output).toBe("out.yaml");
  });

  it("should parse --model flag", () => {
    const opts = parseCli(["define", "--model", "openai:gpt-4o"]);
    expect(opts.model).toBe("openai:gpt-4o");
  });

  it("should parse multiple --param flags as key=value", () => {
    const opts = parseCli([
      "execute",
      "template.yaml",
      "--param",
      "project=/path",
      "--param",
      "story=US-001.md",
    ]);
    expect(opts.command).toBe("execute");
    expect(opts.positional).toEqual(["template.yaml"]);
    expect(opts.params).toEqual({ project: "/path", story: "US-001.md" });
  });

  it("should parse --format flag", () => {
    const opts = parseCli(["trace", "log.json", "--format", "tree"]);
    expect(opts.format).toBe("tree");
  });

  it("should parse --artifacts boolean flag", () => {
    const opts = parseCli(["trace", "log.json", "--artifacts"]);
    expect(opts.artifacts).toBe(true);
  });

  it("should parse --export flag", () => {
    const opts = parseCli(["trace", "log.json", "--export", "chart.json"]);
    expect(opts.export).toBe("chart.json");
  });

  it("should handle empty args", () => {
    const opts = parseCli([]);
    expect(opts.command).toBe("");
  });
});

describe("parseModelString", () => {
  it("should default to anthropic:claude-sonnet-4-6", () => {
    const ref = parseModelString();
    expect(ref.provider).toBe("anthropic");
    expect(ref.modelId).toBe("claude-sonnet-4-6");
  });

  it("should parse provider:model format", () => {
    const ref = parseModelString("openai:gpt-4o");
    expect(ref.provider).toBe("openai");
    expect(ref.modelId).toBe("gpt-4o");
  });

  it("should parse google:gemini-2.0-flash", () => {
    const ref = parseModelString("google:gemini-2.0-flash");
    expect(ref.provider).toBe("google");
    expect(ref.modelId).toBe("gemini-2.0-flash");
  });

  it("should default to anthropic for plain model string", () => {
    const ref = parseModelString("claude-sonnet-4-6");
    expect(ref.provider).toBe("anthropic");
    expect(ref.modelId).toBe("claude-sonnet-4-6");
  });
});
