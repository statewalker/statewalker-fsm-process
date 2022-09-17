export default function attachStatePrinter({ prefix = "", print = console.log } = {}) {
  return (state) => {
    state.print = (...args) => {
      const shift = state.process.stack.map(() => "  ").join("");
      print(prefix, shift, ...args);
    };
  };
}