import { usePrinter } from "./hooks.printer.js";
import { useInit, useDone, useEventKey, useStateKey } from './hooks.js';

export default function newProcessLogger({ log, prefix = ''} = {}) {
  return () => {
    let print = (log || usePrinter());
    const stateKey = useStateKey();
    const getEventKey = useEventKey();
    useInit(() => print(prefix, `<${stateKey} event="${getEventKey()}">`));
    useDone(() => print(prefix, `</${stateKey}> <!-- event="${getEventKey()}" -->`));
  };
}