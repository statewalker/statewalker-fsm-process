import { useProcess } from "./hooks.js"

export function getProcessPrint(process) {
  const {
    prefix = "",
    print = console.log,
    lineNumbers = false
  } = process._printConfig || {};
  const shift = () => process.stack.map(() => "  ").join("");
  const getPrefix = lineNumbers ? () => {
    const lineCounter = process._printCounter = (process._printCounter || 0) + 1;
    return `[${lineCounter}]${shift()}`;
  } : shift;
  return (...args) => print(prefix, getPrefix(), ...args);
}

export function initPrinter(config) {
  return (process) => process._printConfig = config || {};
}

export function usePrinter() {
  const process = useProcess();
  return getProcessPrint(process);
}
