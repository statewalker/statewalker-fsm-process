export default function newProcessLogger({ prefix = "", log = console.log } = {}) {
  let counter = 0;
  return (state) => {
    const print = (...args) => {
      let shift = state.process.stack.map(() => "  ").join("");
      log(prefix, `[${++counter}]`, shift, ...args);
    };
    state.init(() =>
      print(`<${state.key} event="${state.getEventKey()}">`)
    );
    state.done(() =>
      print(`</${state.key}> <!-- event="${state.getEventKey()}" -->`)
    );
  };
}