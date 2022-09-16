export default class FsmState {

  constructor(process, key, descriptor) {
    this.process = process;
    this.key = key;
    this.descriptor = descriptor;
    this._initHandlers = [];
    this._doneHandlers = [];
    this._dumpHandlers = [];
    this._restoreHandlers = [];
    ["init", "done", 
    "dump", "restore", 
    "dispatch", "getEvent", "getEventKey", "getEventKeys", "acceptsEvent"]
    .forEach(name => this[name] = this[name].bind(this));
  }

  async dispatch(event, ...args) {
    return await this.process.dispatch(event, ...args);
  }

  getEvent() { return this.process.event || {}; }
  getEventKey() { return this.process.getEventKey(); }
  getEventKeys() { return this.process.getEventKeys(); }
  acceptsEvent(eventKey) { return this.process.acceptsEvent(eventKey); }

  init(action) { this._initHandlers.push(action); }
  done(action) { this._doneHandlers.push(action); }
  dump(action) { this._dumpHandlers.push(action); }
  restore(action) { this._restoreHandlers.push(action); }

  async _onDump(...args) {
    for (let i = 0; i < this._dumpHandlers.length; i++) {
      await this._run(this._dumpHandlers[i], ...args);
    }
  }

  async _onRestore(...args) {
    for (let i = 0; i < this._restoreHandlers.length; i++) {
      await this._run(this._restoreHandlers[i], ...args);
    }
  }

  async _onInitialize() {
    for (let i = 0; i < this._initHandlers.length; i++) {
      await this._run(this._initHandlers[i]);
    }
  }

  async _onFinalize() {
    for (let i = this._doneHandlers.length - 1; i >= 0; i--) {
      await this._run(this._doneHandlers[i]);
    }
  }

  async _run(action, ...args) {
    try {
      return await action(...args);
    } catch (err) {
      this.process.handleError(err, { stateKey: this.key });
    }
  }

}