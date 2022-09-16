export default class FsmEvent {
  
  constructor(key, options) {
    this.key = key;
    this.options = options || {};
  }

  _onRestore() {}

  _onDump() {}
}