import FsmProcess from "./FsmProcess.js";

export function createProcess(config, ...handlers) {
  const process = new FsmProcess(config);
  process.bindHandlers(...handlers);
  return process;
}