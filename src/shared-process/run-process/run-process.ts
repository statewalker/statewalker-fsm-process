import type { StageHandler } from "@statewalker/fsm";
import { startFsmProcess } from "@statewalker/fsm";
import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { newAdapter } from "@/shared/adapters/index.ts";
import { getLogger } from "@/shared/logger/index.ts";
import { getStack } from "@/shared-process/adapters/stack/index.ts";

function statesTracer(context: Record<string, unknown>): () => void {
  const stack = [...getStack(context)];
  const currentState = stack.pop();
  const prefix = stack.map(() => "  ").join("");
  const logger = getLogger(context);
  logger.info(`${prefix}<${currentState ?? "START"}>`);
  return () => {
    const logger = getLogger(context);
    logger.info(`${prefix}</${currentState ?? "START"}>`);
  };
}

function newTracker(): [
  trace: (context: Record<string, unknown>) => () => void,
  done: Promise<void>,
] {
  const [getStack] = newAdapter<string[]>("fsm:states", () => []);
  let resolve = () => {};
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return [
    (context: Record<string, unknown>) => {
      const stack = getStack(context);
      return () => {
        if (stack.length === 1) {
          resolve();
        }
      };
    },
    promise,
  ];
}

export async function runProcess<C extends Record<string, unknown>>(options: {
  config: FsmStateConfig;
  context: C;
  load: (state: string, event: string | undefined) => StageHandler<C>[];
}): Promise<{
  terminate: () => Promise<void>;
  done: Promise<void>;
}> {
  const { config, context, load } = options;

  const [trace, done] = newTracker();

  const wrappedLoad = (
    state: string,
    event: string | undefined,
  ): StageHandler<C>[] => {
    const handlers = load(state, event);
    return [statesTracer, trace, ...handlers];
  };

  const terminate = await startFsmProcess(context, config, wrappedLoad);
  return { terminate, done };
}
