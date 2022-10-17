export function combineHandlers(...list) {
  return (...args) => list.forEach((f) => f(...args));
}

export function newStateHandler(handlers = {}) {
  return (state) => handlers[state.key] && handlers[state.key](state);
}

export function checkProcessHandler(handler) {
  if (handler && (typeof handler === 'object')) {
    if (Array.isArray(handler)) {
      const list = [];
      for (let h of handler) {
        h = checkProcessHandler(h);
        list.push(h);
      }
      handler = combineHandlers(...list);
    } else {
      handler = newStateHandler(handler);
    }
  }
  return handler;
}
