import type { StageHandler } from "@statewalker/fsm";
import { startFsmProcess } from "@statewalker/fsm";
import type { FsmStateConfig } from "@statewalker/fsm-validator";
import type { Tracer } from "../observe/tracer.ts";
import type { ExecutionContext, HandlerMap } from "./context.ts";
import { setConfig } from "./context.ts";
import { createDefaultAiHandler, createHandlerLoader } from "./handlers.ts";

export async function run(options: {
  config: FsmStateConfig;
  context: ExecutionContext;
  handlers: HandlerMap<ExecutionContext>;
  extraHandlers?: StageHandler<ExecutionContext>[];
  tracer?: Tracer;
}): Promise<{
  terminate: () => Promise<void>;
  done: Promise<void>;
  tracer?: Tracer;
}> {
  const { config, context, handlers, extraHandlers = [], tracer } = options;

  setConfig(context, config);

  const defaultHandler = createDefaultAiHandler();
  const appLoader = createHandlerLoader(config, handlers, defaultHandler);

  let resolveDone: () => void;
  const done = new Promise<void>((r) => {
    resolveDone = r;
  });

  const tracerHandler = tracer?.asHandler<ExecutionContext>();

  const load = (
    state: string,
    event: string | undefined,
  ): StageHandler<ExecutionContext>[] => {
    const prefix: StageHandler<ExecutionContext>[] = [];
    if (tracerHandler) prefix.push(tracerHandler);
    prefix.push(...extraHandlers);

    const appHandlers = appLoader(state, event);
    const all = [...prefix, ...appHandlers];

    if (state === config.key) {
      const rootHandler: StageHandler<ExecutionContext> = () => {
        return () => {
          resolveDone();
        };
      };
      return [rootHandler, ...all];
    }

    return all;
  };

  const terminate = await startFsmProcess(context, config, load);

  return { terminate, done, tracer };
}
