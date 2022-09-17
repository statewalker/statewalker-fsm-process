import expect from 'expect.js';
import { initAsyncProcess } from "../src/index.js";
import config from "./productCatalogStatechart.js";
import newStateHandler from "../src/newStateHandler.js"

describe('newStateHandler', () => {

  function newPrintChecker() {
    const lines = [];
    return [lines, (...control) => expect(lines).to.eql(control)];
  }

  it(`should track transitions between states`, async () => {
    const [lines, checkLines] = newPrintChecker();

    const handler = newStateHandler({
      "App": ({ init, done }) => {
        init(() => lines.push('-> App'));
        done(() => lines.push('<- App'));
      },
      "ProductList": ({ init, done }) => {
        init(() => lines.push('  -> ProductList'));
        done(() => lines.push('  <- ProductList'));
      },
    });
    const process = initAsyncProcess({ config, handler, handleError: console.error });

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
