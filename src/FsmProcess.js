import { MODE, newAsyncProcess, getStateDescriptor, getAllTransitions } from "@statewalker/fsm";
import FsmEvent from "./FsmEvent.js";
import FsmState from "./FsmState.js";

export default class FsmProcess {

  constructor(config, options = {}) {
    this.options = options;
    this.status = 0;
    this.stack = [];
    this.event = undefined;
    this.current = undefined;
    this._started = false;
    this._listeners = {};
    newAsyncProcess({
      config,
      before: async () => {
        this._started = true;
        const state = this.current;
        await state._onInitialize();
      },
      after: async () => {
        const state = this.current;
        await state._onFinalize();
      },
      newProcess: (descriptor) => {
        this.descriptor = descriptor;
        return this;
      },
      newState: ({ key, descriptor }) => this._getNewState(key, descriptor),
    })
  }

  // Notifications
  on(stateKey, listener) {
    (this._listeners[stateKey] = (this._listeners[stateKey] || [])).push(listener);
    return () => this.off(stateKey, listener);
  }

  off(event, listener) {
    this._listeners[event] = (this._listeners[event] || []).filter(l => l !== listener);
  }

  get started() { return this._started; }
  // get finished() { return this.started && this.stack.length === 0; }

  getEventKey() { return this.event ? this.event.key : ''; }
  getStateKey() { return this.current ? this.current.key : ''; }
  getEventKeys() {
    const transitions = this._getTransitionsIndex();
    return Object.keys(transitions).sort();
  }
  acceptsEvent(eventKey) {
    const transitions = this._getTransitionsIndex();
    return eventKey in transitions;
  }


  set next(f) { this._next = f; } // FIXME:

  async dispatch(eventKey, options = {}) {
    if (this.finished) return ;
    const ev = eventKey !== undefined
      ? this._newFsmEvent(eventKey, options)
      : null;
    return this._next(ev);
  }

  bindHandlers(...handlers) {
    const regs = [];
    for (const obj of handlers) {
      for (const [key, handler] of Object.entries(obj)) {
        if (Array.isArray(handler)) {
          regs.push(...handler.map(h => this.on(key, h)));
        } else {
          regs.push(this.on(key, handler));
        }
      }
    }
    return () => regs.forEach(r => r && r());
  }

  async dump(dump = {}, ...args) {
    dump.status = this.status;
    if (this.event) {
      const data = {};
      await this.event._onDump(data, ...args);
      dump.event = {
        key: this.event.key,
        options: { ...this.event.options },
        data
      }
    }
    dump.stack = [];
    const dumpState = async (state) => {
      if (!state) return null;
      const data = {};
      await state._onDump(data, ...args);
      return { key: state.key, data }
    }
    for (let i = 0; i < this.stack.length; i++) {
      dump.stack.push(await dumpState(this.stack[i]));
    }
    dump.current = await dumpState(this.current);
    return dump;
  }

  async restore(dump = {}, ...args) {
    this.status = dump.status || MODE.NONE;
    const eventDump = dump.event;
    this.event = eventDump
      ? this._newFsmEvent(eventDump.key, eventDump.options)
        ._onRestore(eventDump.data, ...args)
      : null;

    const restoreState = async (stateDump) => {
      if (!stateDump) return;
      const descriptor = this.stack.length
        ? getStateDescriptor(this, stateDump.key)
        : this.descriptor;
      const state = this._getNewState(stateDump.key, descriptor);
      await state._onRestore(stateDump.data, ...args);
      return state;
    }
    this.stack = [];
    for (let i = 0; i < dump.stack.length; i++) {
      this.stack.push(await restoreState(dump.stack[i]));
    }
    this.current = await restoreState(dump.current);
    return this;
  }

  _notify(event, ...args) {
    for (const l of (this._listeners[event] || [])) { l(...args); }
  }

  _newFsmEvent(key, options) {
    return new FsmEvent(key, options);
  }

  _newState(key, descriptor) {
    return new FsmState(this, key, descriptor);
  }

  _getNewState(key, descriptor) {
    const state = this._newState(key, descriptor);
    this._notify('*', state);
    this._notify(state.key, state);
    return state;
  }

  _getTransitionsIndex() {
    const transitions = getAllTransitions(this);
    const index = {};
    for (const t of transitions) {
      // parentStateKey, sourceStateKey, eventKey, targetStateKey
      const eventKey = t[2];
      if (eventKey in index) continue;
      const targetStateKey = t[3];
      index[eventKey] = targetStateKey;
    }
    return index;
  }

  async handleError(err, options) {
    const errObj = Object.assign({}, { message: err.message }, err, options);
    if (this.options.handleError) {
      await this.options.handleError(errObj);
    } else {
      console.log(`ERROR: ${JSON.stringify(errObj, null, 2)}`, err);
    }
  }

}
