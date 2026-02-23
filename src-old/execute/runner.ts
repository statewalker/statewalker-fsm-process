import type { StageHandler } from "@statewalker/fsm";
import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { setConfig } from "../adapters/config.adapter.ts";
import { setTracer } from "../adapters/tracer.adapter.ts";
import type { Tracer } from "../observe/tracer.ts";
import { runProcess } from "../run-process.ts";
import type { ExecutionContext, HandlerMap } from "./context.ts";
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
  if (tracer) setTracer(context, tracer);

  const appLoader = createHandlerLoader(
    config,
    handlers,
    createDefaultAiHandler(),
  );
  const tracerHandler = tracer?.asHandler<ExecutionContext>();

  const result = await runProcess({
    config,
    context,
    load: (state, event) => {
      const prefix: StageHandler<ExecutionContext>[] = [];
      if (tracerHandler) prefix.push(tracerHandler);
      prefix.push(...extraHandlers);
      return [...prefix, ...appLoader(state, event)];
    },
  });

  return { ...result, tracer };
}
