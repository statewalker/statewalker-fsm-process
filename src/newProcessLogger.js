export default function newProcessLogger({ log, prefix } = {}) {
  return (state) => {
    let print = (log || state.print || console.log);
    print = prefix ? print.bind(state, prefix) : print.bind(state);
    state.init(() =>
      print(`<${state.key} event="${state.getEventKey()}">`)
    );
    state.done(() =>
      print(`</${state.key}> <!-- event="${state.getEventKey()}" -->`)
    );
  };
}