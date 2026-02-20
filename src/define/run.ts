import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { startFsmProcess } from "@statewalker/fsm";
import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { parse } from "yaml";
import { load } from "./handlers/index.ts";

const TEMPLATE_PATH = resolve(
  import.meta.dirname ?? ".",
  "../../templates/define-process-hfsm.yaml",
);

export async function runDefine(context: Record<string, unknown>): Promise<{
  terminate: () => Promise<void>;
  done: Promise<void>;
}> {
  const yamlContent = await readFile(TEMPLATE_PATH, "utf-8");
  const config = parse(yamlContent) as FsmStateConfig;

  let resolveDone: () => void;
  const done = new Promise<void>((r) => {
    resolveDone = r;
  });

  const rootLoad = (state: string, event: undefined | string) => {
    const handlers = load(state, event);
    if (state === config.key) {
      const rootHandler = () => {
        return () => {
          resolveDone?.();
        };
      };
      return [rootHandler, ...handlers];
    }
    return handlers;
  };

  const terminate = await startFsmProcess(context, config, rootLoad);

  return { terminate, done };
}
