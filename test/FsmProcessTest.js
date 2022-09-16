import expect from 'expect.js';
import FsmProcess from "../src/FsmProcess.js";

describe('FsmProcess', () => {

  function getPath(process) {
    const stack = [...process.stack];
    process.current && stack.push(process.current);
    return stack.map(s => s.key).join('/')
  }

  function newPrinter(process, traces) {
    return (msg) => {
      let shift = '';
      for (let i = 0; i <= process.stack.length; i++) {
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

  it(`should iterate over states and perform required state transitions`, async () => {

    const main = {
      key: 'MAIN',
      transitions: [
        ['', '*', 'LOGIN', { key: 'logIn', message: 'Hello, there' }],
        ['LOGIN', 'ok', 'MAIN_VIEW'],
        ['MAIN_VIEW', '*', 'MAIN_VIEW'],
        ['MAIN_VIEW', 'logout', 'LOGIN'],
      ],
      states: [
        {
          key: 'LOGIN',
          transitions: [
            ['', '*', 'FORM']
          ],
        },
        {
          key: 'MAIN_VIEW',
          transitions: [
            ['*', '*', 'PAGE_VIEW'],
            ['*', 'logout', ''],
            ['PAGE_VIEW', 'edit', 'PAGE_EDIT'],
            ['PAGE_EDIT', 'ok', 'PAGE_UPDATED_MESSAGE'],
          ],
          states: [
            {
              key: 'PAGE_EDIT',
              transitions: [
                ['', '*', 'FORM']
              ],
            }
          ]
        },

        {
          key: 'FORM',
          transitions: [
            ['', '*', 'SHOW_FORM'],
            ['SHOW_FORM', '*', 'VALIDATE_FORM'],
            ['SHOW_FORM', 'cancel', ''],
            ['VALIDATE_FORM', 'ok', ''],
            ['VALIDATE_FORM', '*', 'SHOW_FORM_ERRORS'],
            ['SHOW_FORM_ERRORS', '*', 'SHOW_FORM'],
            ['SHOW_FORM_ERRORS', 'cancel', ''],
          ],
        }
      ],
    }
    const options = {
      config: main,
      events: [
        // Start application
        '',
        // Login session
        'submit', 'error', 'ok', 'submit', 'ok',
        // Main state
        'tto',
        // Edit
        'edit', 'submit', 'ok',
        // Close the result message
        'ok',
        // Exit from the main view
        'logout'
      ],
      control: [
        '-[]->MAIN/LOGIN/FORM/SHOW_FORM',
        '-[submit]->MAIN/LOGIN/FORM/VALIDATE_FORM',
        '-[error]->MAIN/LOGIN/FORM/SHOW_FORM_ERRORS',
        '-[ok]->MAIN/LOGIN/FORM/SHOW_FORM',
        '-[submit]->MAIN/LOGIN/FORM/VALIDATE_FORM',
        '-[ok]->MAIN/MAIN_VIEW/PAGE_VIEW',
        '-[tto]->MAIN/MAIN_VIEW/PAGE_VIEW',
        '-[edit]->MAIN/MAIN_VIEW/PAGE_EDIT/FORM/SHOW_FORM',
        '-[submit]->MAIN/MAIN_VIEW/PAGE_EDIT/FORM/VALIDATE_FORM',
        '-[ok]->MAIN/MAIN_VIEW/PAGE_UPDATED_MESSAGE',
        '-[ok]->MAIN/MAIN_VIEW/PAGE_VIEW',
        '-[logout]->MAIN/LOGIN/FORM/SHOW_FORM',
      ],
      traces: [
        '  <MAIN event="">',
        '    <LOGIN event="">',
        '      <FORM event="">',
        '        <SHOW_FORM event="">',
        '         [SHOW_FORM:]',
        '        </SHOW_FORM>',
        '        <VALIDATE_FORM event="submit">',
        '         [VALIDATE_FORM:submit]',
        '        </VALIDATE_FORM>',
        '        <SHOW_FORM_ERRORS event="error">',
        '         [SHOW_FORM_ERRORS:error]',
        '        </SHOW_FORM_ERRORS>',
        '        <SHOW_FORM event="ok">',
        '         [SHOW_FORM:ok]',
        '        </SHOW_FORM>',
        '        <VALIDATE_FORM event="submit">',
        '         [VALIDATE_FORM:submit]',
        '        </VALIDATE_FORM>',
        '      </FORM>',
        '    </LOGIN>',
        '    <MAIN_VIEW event="ok">',
        '      <PAGE_VIEW event="ok">',
        '       [PAGE_VIEW:ok]',
        '      </PAGE_VIEW>',
        '      <PAGE_VIEW event="tto">',
        '       [PAGE_VIEW:tto]',
        '      </PAGE_VIEW>',
        '      <PAGE_EDIT event="edit">',
        '        <FORM event="edit">',
        '          <SHOW_FORM event="edit">',
        '           [SHOW_FORM:edit]',
        '          </SHOW_FORM>',
        '          <VALIDATE_FORM event="submit">',
        '           [VALIDATE_FORM:submit]',
        '          </VALIDATE_FORM>',
        '        </FORM>',
        '      </PAGE_EDIT>',
        '      <PAGE_UPDATED_MESSAGE event="ok">',
        '       [PAGE_UPDATED_MESSAGE:ok]',
        '      </PAGE_UPDATED_MESSAGE>',
        '      <PAGE_VIEW event="ok">',
        '       [PAGE_VIEW:ok]',
        '      </PAGE_VIEW>',
        '    </MAIN_VIEW>',
        '    <LOGIN event="logout">',
        '      <FORM event="logout">',
        '        <SHOW_FORM event="logout">',
        '         [SHOW_FORM:logout]',
      ]
    }

    const testTraces = [];
    const process = new FsmProcess(main);
    const print = newPrinter(process, testTraces);
    process.bindHandlers({
      '*' : newPrintHandler(print)
    })

    const { events, control, traces } = options;
    const test = [];
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      await process.dispatch(event);

      const stateKey = process.getStateKey();
      const eventKey = process.getEventKey();
      test.push(`-[${eventKey}]->${getPath(process)}`);
      print(` [${stateKey}:${eventKey}]`);
    }
    expect(test).to.eql(control);
    expect(testTraces).to.eql(traces);
  })

  it(`should be able to iterate over the process and check available transitions`, async () => {

    const config = {
      key: 'Selection',
      transitions: [
        ['', '*', 'NonSelected'],
        ['NonSelected', 'select', 'Selected'],
        ['Selected', 'clear', 'NonSelected'],
        ['*', 'error', 'HandleError'],
        ['HandleError', '*', ''],
        ['HandleError', 'fixed', 'NonSelected'],
      ],
      states: [
        {
          key: 'Selected',
          transitions: [
            ['', '*', 'UpdateSelection'],
            ['UpdateSelection', 'select', 'UpdateSelection'],
            ['UpdateSelection', 'clear', '']
          ]
        }
      ]
    }

    const traces = [];
    let errors = [];
    const process = new FsmProcess(config, {
      async handleError(err) {
        errors.push(err);
      }
    });
    const print = newPrinter(process, traces);
    process.bindHandlers({
      '*': newPrintHandler(print)
    })

    process.on('Selected', (state) => {
      state.init(() => { throw new Error('Hello') });
    })
    process.on('HandleError', (state) => {
      state.done(() => { errors = []; });
    })

    await process.dispatch('abc');

    expect(errors.length).to.eql(0);
    expect(process.started).to.be(true);
    expect(process.finished).to.be(false);
    expect(process.current.key).to.eql('NonSelected');
    expect(process.current.getEventKeys()).to.eql(['error', 'select']);
    expect(process.current.acceptsEvent('clear')).to.be(false);
    expect(process.current.acceptsEvent('error')).to.be(true);
    expect(process.current.acceptsEvent('select')).to.be(true);
    expect(process.current.acceptsEvent('*')).to.be(false);
    expect(process.current.acceptsEvent('foo')).to.be(false);
    expect(traces).to.eql([
      '  <Selection event="abc">',
      '    <NonSelected event="abc">'
    ]);

    await process.dispatch('select');
    expect(errors.length).to.eql(1);
    expect(errors[0].message).to.eql('Hello');
    expect(process.started).to.be(true);
    expect(process.finished).to.be(false);
    expect(process.current.key).to.eql('UpdateSelection');
    expect(process.current.getEventKeys()).to.eql(['clear', 'error', 'select']);
    expect(process.current.acceptsEvent('clear')).to.be(true);
    expect(process.current.acceptsEvent('error')).to.be(true);
    expect(process.current.acceptsEvent('select')).to.be(true);
    expect(process.current.acceptsEvent('*')).to.be(false);
    expect(process.current.acceptsEvent('foo')).to.be(false);
    expect(traces).to.eql([
      '  <Selection event="abc">',
      '    <NonSelected event="abc">',
      '    </NonSelected>',
      '    <Selected event="select">',
      '      <UpdateSelection event="select">'
    ]);

    await process.dispatch('error');
    expect(errors.length).to.eql(1);
    expect(process.started).to.be(true);
    expect(process.finished).to.be(false);
    expect(process.current.key).to.eql('HandleError');
    expect(process.current.getEventKeys()).to.eql(['*', 'error', 'fixed']);
    expect(process.current.acceptsEvent('clear')).to.be(false);
    expect(process.current.acceptsEvent('error')).to.be(true);
    expect(process.current.acceptsEvent('select')).to.be(false);
    expect(process.current.acceptsEvent('fixed')).to.be(true);
    expect(process.current.acceptsEvent('*')).to.be(true);
    expect(process.current.acceptsEvent('foo')).to.be(false);
    expect(traces).to.eql([
      '  <Selection event="abc">',
      '    <NonSelected event="abc">',
      '    </NonSelected>',
      '    <Selected event="select">',
      '      <UpdateSelection event="select">',
      '      </UpdateSelection>',
      '    </Selected>',
      '    <HandleError event="error">'
    ]);

    await process.dispatch('exit');
    expect(errors.length).to.eql(0);
    expect(process.started).to.be(true);
    expect(process.finished).to.be(true);
    expect(process.current).to.be(undefined);
    expect(traces).to.eql([
      '  <Selection event="abc">',
      '    <NonSelected event="abc">',
      '    </NonSelected>',
      '    <Selected event="select">',
      '      <UpdateSelection event="select">',
      '      </UpdateSelection>',
      '    </Selected>',
      '    <HandleError event="error">',
      '    </HandleError>',
      '  </Selection>'
    ]);
  })
});
