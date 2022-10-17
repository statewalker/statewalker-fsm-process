let state;
export function _setState(s) {
  state = s;
}
export function useState() {
  if (!state) throw new Error("This method should be called only from state handlers");
  return state;
}
export function withState(action) {
  return action(useState());
}
export function useStateKey() {
  return withState(state => state.key);
}
export function useInit(action) {
  return withState(state => state.init(action));
}
export function useDone(action) {
  return withState(state => state.done(action));
}
export function useProcess() {
  return useState().process;
}
export function withProcess(action) {
  const state = useState();
  return action(state.process, state);
}
export function initProcess(action) {
  let initialized = false;
  return () => {
    if(!initialized) {
      initialized = true;
      withProcess(action);
    }
  }
}

export function useDump(action) {
  return withState(state => state.dump(action));
}
export function useRestore(action) {
  return withState(state => state.restore(action));
}

export function useDispatch() {
  return withProcess(process => (...args) => process.dispatch(...args));
}
export function useEvent() {
  return withProcess(process => () => process.event || {});
}
export function useEventKey() {
  const getEvent = useEvent();
  return () => getEvent().key;
}