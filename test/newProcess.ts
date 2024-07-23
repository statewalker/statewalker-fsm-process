import {
  type FsmStateConfig,
  FsmProcess,
  setProcessTracer,
  setProcessPrinter,
  type FsmState,
  getPrinter,
} from "@statewalker/fsm";

export function newProcess(
  root: FsmStateConfig,
  config: {
    prefix?: string;
    print: (...args: string[]) => void;
    lineNumbers: boolean;
  }
): FsmProcess {
  let process: FsmProcess;
  process = new FsmProcess(root);
  setProcessTracer(process);
  setProcessPrinter(process, {
    prefix: config.prefix,
    lineNumbers: true,
    print: config.print, // console.error,
  });
  // process.onStateCreate((state: FsmState) => {
  //   const log = getPrinter(state);
  //   state.onEnter(() => log(`- ENTER: ${state.key}`));
  //   state.onExit(() => log(`- EXIT ${state.key}`));
  // });
  return process;
}
