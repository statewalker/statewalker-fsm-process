export default function newStateHandler(handlers = {}) {
  return (state) => handlers[state.key] && handlers[state.key](state);
}