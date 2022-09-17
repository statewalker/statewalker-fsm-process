import expect from 'expect.js';
import { initAsyncProcess } from "../src/index.js";
import config from "./productCatalogStatechart.js";
import combineHandlers from '../src/combineHandlers.js';
import attachStatePrinter from "../src/attachStatePrinter.js"

describe('attachStatePrinter', () => {

  function newPrintChecker() {
    const lines = [];
    return [lines, (...control) => expect(lines.map(items => items.join(''))).to.eql(control)];
  }

  it(`should track transitions between states`, async () => {
    const [lines, checkLines] = newPrintChecker();

    const handler = combineHandlers(
      attachStatePrinter({ print: (...args) => lines.push(args) }),
      ({ key, init, getEventKey, print }) => {
        expect(typeof print).to.be("function");
        init(() => print('* ', key, ': ', getEventKey()))
      }
    );
    let error;
    const process = initAsyncProcess({ config, handler, handleError: (e) => error = e });

    await process.next({ key: "start" });
    if (error) throw error;
    checkLines(
      '* App: start',
      '  * ProductCatalog: start',
      '    * ProductList: start'
    )

    await process.next({ key: "showBasket" });
    if (error) throw error;
    checkLines(
      '* App: start',
      '  * ProductCatalog: start',
      '    * ProductList: start',
      '  * ProductBasket: showBasket',
      '    * ShowSelectedProducts: showBasket'
    )


    await process.next({ key: "back" });
    if (error) throw error;
    checkLines(
      '* App: start',
      '  * ProductCatalog: start',
      '    * ProductList: start',
      '  * ProductBasket: showBasket',
      '    * ShowSelectedProducts: showBasket',
      '  * ProductCatalog: back',
      '    * ProductList: back'
    )

    await process.next({ key: "exit" });
    if (error) throw error;
    checkLines(
      '* App: start',
      '  * ProductCatalog: start',
      '    * ProductList: start',
      '  * ProductBasket: showBasket',
      '    * ShowSelectedProducts: showBasket',
      '  * ProductCatalog: back',
      '    * ProductList: back'
    )
  })

});
