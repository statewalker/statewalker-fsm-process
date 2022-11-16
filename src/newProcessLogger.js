import { usePrinter } from "./hooks.printer.js";
import { onActivate, onDeactivate, useEventKey, useStateKey } from './hooks.js';

export default function newProcessLogger({ log, prefix = ''} = {}) {
  return () => {
    let print = (log || usePrinter());
    const stateKey = useStateKey();
    const getEventKey = useEventKey();
    onActivate(() => print(prefix, `<${stateKey} event="${getEventKey()}">`));
    onDeactivate(() => print(prefix, `</${stateKey}> <!-- event="${getEventKey()}" -->`));
  };
}