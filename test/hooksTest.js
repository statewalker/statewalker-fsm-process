import expect from 'expect.js';
import { initAsyncProcess } from "../src/index.js";
import config from "./productCatalogStatechart.js";
import { useInit, useDone } from "../src/hooks.js";

describe('hooks.js', () => {

  function newPrintChecker() {
    const lines = [];
    return [(...args) => lines.push(args.join('')), (...control) => expect(lines).to.eql(control)];
  }

  it(`useInit registration methods should throw exceptions when called directly`, async () => {
    function checkDirectCalls(method) {
      let error;
      try {
        method(() => {});
      } catch(e) {
        error = e;
      }
      expect(error instanceof Error).to.be(true)
    }
    checkDirectCalls(useInit);
    checkDirectCalls(useDone);
  })

  it(`should properly invoke callbacks registered with the useInit/useDone methods`, async () => {
    const [print, checkLines] = newPrintChecker();

    const process = initAsyncProcess({
      config,
      handler : {
        "App": () => {
          useInit(() => print('-> App'));
          useDone(() => print('<- App'));
        },
        "ProductList": () => {
          useInit(() => print('  -> ProductList'));
          useDone(() => print('  <- ProductList'));
        },
      },
      handleError: console.error
    });

    await process.next({ key: "start" });
    checkLines(
      '-> App',
      '  -> ProductList'
    )

    await process.next({ key: "showBasket" });
    checkLines(
      '-> App',
      '  -> ProductList',
      '  <- ProductList' 
    )

  })

});
