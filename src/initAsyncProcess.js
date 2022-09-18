import { newAsyncProcess, getStateDescriptor } from "@statewalker/fsm";

export default function initAsyncProcess({ config, handler, handleError = console.error }) {

  const before = async (process, ...args) => {
    process._started = true;
    const state = process.current;
    handler(state);
    await state.init.run(...args);
  };

  const after = async (process) => {
    const state = process.current;
    await state.done.run();
  };

  const newProcess = (descriptor) => {
    return {
      descriptor,
      config,
      status: 0,
      stack: [],
      event: undefined,
      current: undefined
    };
  };

  const newState = ({ process, key, descriptor }) => {
    const state = {
      process,
      key,
      descriptor,
      init: newStateMethod(),
      done: newStateMethod(),
      dump: newStateMethod(),
      restore: newStateMethod(),
      dispatch: (...args) => state.process.dispatch(...args),
      getEvent: () => state.process.event || {},
      getEventKey: () => state.getEvent().key
    }
    return state;
  }

  const process = newAsyncProcess({
    config,
    before,
    after,
    newProcess,
    newState,
    handleError
  });

  process.dispatch = (key, params = {}) => {
    process.next({ key, params });
  };

  process.dump = async (dump = {}, ...args) => {
    dump.status = process.status;
    dump.event = { ...(process.event || {}) }
    dump.stack = [];
    const dumpState = async (state) => {
      if (!state) return null;
      const data = {};
      await state.dump.run(data, ...args);
      return { key: state.key, data }
    }
    for (let i = 0; i < process.stack.length; i++) {
      dump.stack.push(await dumpState(process.stack[i]));
    }
    dump.current = await dumpState(process.current);
    return dump;
  }

  process.restore = async (dump, ...args) => {
    if (process._started) throw new Error('Can not restore a started process');
    process._started = true;
    process.status = dump.status || 0;
    process.event = { ...dump.event };

    const restoreState = async (stateDump) => {
      if (!stateDump) return;
      const descriptor = process.stack.length
        ? getStateDescriptor(process, stateDump.key)
        : process.descriptor;
      const state = newState({ process, key: stateDump.key, descriptor });
      handler(state);
      await state.restore.run(stateDump.data, ...args);
      return state;
    }
    for (let i = 0; i < dump.stack.length; i++) {
      process.stack.push(await restoreState(dump.stack[i]));
    }
    process.current = await restoreState(dump.current);
    return process;
  }

  return process;

  function newStateMethod() {
    const list = [];
    return Object.assign((m) => list.push(m), {
      run: async (...args) => {
        // We use the index to iterate over the list: the list can be updated by called methods
        for (let i = 0; i < list.length; i++) {
          try {
            list[i] && (await list[i](...args));
          } catch (error) {
            console.error(error);
            await handleError(error);
          }
        }
      }
    });
  }
}