import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { parse } from "yaml";
import { runProcess } from "../run-process.ts";
import { load } from "./handlers/index.ts";

const TEMPLATE_PATH = resolve(
  import.meta.dirname ?? ".",
  "../../templates/define-process-hfsm.yaml",
);

export async function runDefine(context: Record<string, unknown>): Promise<{
  terminate: () => Promise<void>;
  done: Promise<void>;
}> {
  const config = parse(
    await readFile(TEMPLATE_PATH, "utf-8"),
  ) as FsmStateConfig;
  return runProcess({ config, context, load });
}
