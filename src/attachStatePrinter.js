export default function attachStatePrinter({
  prefix = "",
  print = console.log,
  lineNumbers = false
} = {}) {
  let counter = 0;
  return (state) => {
    state.print = (...args) => {
      let shift = state.process.stack.map(() => "  ").join("");
      lineNumbers && (shift = `[${++counter}]${shift}`)
      print(prefix, shift, ...args);
    };
  };
}