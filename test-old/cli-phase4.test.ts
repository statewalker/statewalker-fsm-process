import { parseCli } from "../src/cli/index.ts";
import { describe, expect, it } from "./deps.ts";

describe("CLI Phase 4 flags", () => {
  it("should parse --validate-only flag", () => {
    const opts = parseCli(["define", "--validate-only", "-i", "desc.txt"]);
    expect(opts.command).toBe("define");
    expect(opts.validateOnly).toBe(true);
  });

  it("should parse --dry-run flag", () => {
    const opts = parseCli(["execute", "--dry-run", "template.yaml"]);
    expect(opts.command).toBe("execute");
    expect(opts.dryRun).toBe(true);
    expect(opts.positional).toEqual(["template.yaml"]);
  });

  it("should parse --resume flag", () => {
    const opts = parseCli(["execute", "--resume", "snapshot.json"]);
    expect(opts.command).toBe("execute");
    expect(opts.resume).toBe("snapshot.json");
  });

  it("should default Phase 4 flags to undefined", () => {
    const opts = parseCli(["define", "-i", "input.txt"]);
    expect(opts.validateOnly).toBeUndefined();
    expect(opts.dryRun).toBeUndefined();
    expect(opts.resume).toBeUndefined();
  });

  it("should combine Phase 4 flags with other options", () => {
    const opts = parseCli([
      "execute",
      "--dry-run",
      "--model",
      "openai:gpt-4",
      "-p",
      "key=val",
      "template.yaml",
    ]);
    expect(opts.dryRun).toBe(true);
    expect(opts.model).toBe("openai:gpt-4");
    expect(opts.params).toEqual({ key: "val" });
    expect(opts.positional).toEqual(["template.yaml"]);
  });
});
