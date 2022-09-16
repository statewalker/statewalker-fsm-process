import expect from 'expect.js';
import FsmProcess from "../src/FsmProcess.js";

describe('FsmProcess continuations: process is dumped and restored at each step', () => {


  function getPath(process) {
    const stack = [...process.stack];
    process.current && stack.push(process.current);
    return stack.map(s => s.key).join('/')
  }

  function newPrinter(process, traces) {
    return (msg) => {
      let shift = '';
      for (let i = 0; i < process.stack.length; i++) {
        shift += '  ';
      }
      traces.push(shift + msg);
    }
  }

  function newPrintHandler(print) {
    return ({ init, done, key, getEventKey }) => {
      init(() => print(`<${key} event="${getEventKey()}">`));
      done(() => print(`</${key}>`))
    }
  }

  const config = {
    key: 'Selection',
    transitions: [
      ['*', 'exit', ''],
      ['*', '*', 'Wait'],
      ['Wait', 'select', 'Selected'],
      ['*', 'error', 'HandleError'],
      ['HandleError', '*', 'Wait'],
    ],
    states: [
      {
        key: 'Selected',
        transitions: [
          ['', '*', 'Wait'],
          ['Wait', 'select', 'UpdateSelection'],
          ['UpdateSelection', '*', 'Wait']
        ]
      }
    ]
  }


  let dump, stepId = 0, traces = [];
  let dumped = [], restored = [];
  async function run(...events) {
    const process = new FsmProcess(config);
    const print = newPrinter(process, traces);
    process.bindHandlers({
      '*': newPrintHandler(print),
      'HandleError': ({ init }) => {
        init(() => print('HANDLE ERROR'))
      }
    }, {
      '*': ({ key, dump, restore }) => {
        dump((data) => {
          dumped.push(`${key}:${stepId}`);
          data.stepId = stepId;
        })
        restore((dump) => {
          restored.push(`${key}:${dump.stepId}`)
        })
      }
    })
    if (dump) await process.restore(dump);

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      await process.dispatch(event);
      print(`step ${++stepId}`);
    }
    dump = await process.dump();
    // console.log(dump)
  }

  let control = [];
  it(`process starts and runs while event is defined`, async () => {
    expect(dumped).to.eql([]);
    expect(restored).to.eql([]);
    await run("");
    control.push(
      '<Selection event="">',
      '  <Wait event="">',
      '  step 1'
    );
    expect(traces).to.eql(control);
    expect(dump).to.eql({
      status: 4,
      event: { key: '', options: {}, data: {} },
      stack: [{ key: 'Selection', data: { stepId: 1 } }],
      current: { key: 'Wait', data: { stepId: 1 } }
    })
    expect(dumped).to.eql(['Selection:1', 'Wait:1']);
    expect(restored).to.eql([]);
    dumped = []; restored = [];
  })

  it(`continue the process and stop at the embedded wait state cleaning events`, async () => {
    await run('select');
    control.push(
      '  </Wait>',
      '  <Selected event="select">',
      '    <Wait event="select">',
      '    step 2'
    );
    expect(traces).to.eql(control);
    expect(restored).to.eql(['Selection:1', 'Wait:1']);
    expect(dumped).to.eql(['Selection:2', 'Selected:2', 'Wait:2']);
    dumped = []; restored = [];
  })

  it(`the same event triggers an internal transition between sub-states`, async () => {
    await run('select', '');
    control.push(
      '    </Wait>',
      '    <UpdateSelection event="select">',
      '    step 3',
      '    </UpdateSelection>',
      '    <Wait event="">',
      '    step 4'
    );
    expect(traces).to.eql(control);
    expect(restored).to.eql(['Selection:2', 'Selected:2', 'Wait:2']);
    // The step 3 is skipped
    expect(dumped).to.eql(['Selection:4', 'Selected:4', 'Wait:4']);
    dumped = []; restored = [];
  })

  it(`an event not defined in the sub-state moves the process to the parent state`, async () => {
    await run('reset');
    control.push(
      '    </Wait>',
      '  </Selected>',
      '  <Wait event="reset">',
      '  step 5'
    );
    expect(traces).to.eql(control);
    expect(restored).to.eql(['Selection:4', 'Selected:4', 'Wait:4']);
    expect(dumped).to.eql(['Selection:5', 'Wait:5']);
    dumped = []; restored = [];
  })

  it(`check error handling`, async () => {
    await run('error');
    control.push(
      '  </Wait>',
      '  <HandleError event="error">',
      '  HANDLE ERROR',
      '  step 6',
    );
    expect(traces).to.eql(control);
    expect(restored).to.eql(['Selection:5', 'Wait:5']);
    expect(dumped).to.eql(['Selection:6', 'HandleError:6']);
    dumped = []; restored = [];
  })

  it(`go to the internal wait state`, async () => {
    await run('');
    control.push(
      '  </HandleError>',
      '  <Wait event="">',
      '  step 7',
    );
    expect(traces).to.eql(control);
    expect(dump.status).to.eql(4);
    expect(restored).to.eql(['Selection:6', 'HandleError:6']);
    expect(dumped).to.eql(['Selection:7', 'Wait:7']);
    dumped = []; restored = [];
  })

  it(`check events handling not available in the transition descriptions`, async () => {
    await run('toto');
    control.push(
      '  </Wait>',
      '  <Wait event="toto">',
      '  step 8'
    );
    expect(traces).to.eql(control);
    expect(dump.status).to.eql(4);
    expect(restored).to.eql(['Selection:7', 'Wait:7']);
    expect(dumped).to.eql(['Selection:8', 'Wait:8']);
    dumped = []; restored = [];
  })

  it(`finalize process`, async () => {
    await run('exit');
    control.push(
      '  </Wait>',
      '</Selection>',
      'step 9'
    );
    expect(traces).to.eql(control);
    expect(dump.status).to.eql(0);
    expect(restored).to.eql(['Selection:8', 'Wait:8']);
    expect(dumped).to.eql([]);
    dumped = []; restored = [];
  })

});
