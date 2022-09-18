import expect from 'expect.js';
import initAsyncProcess from "../src/initAsyncProcess.js";
import combineHandlers from '../src/combineHandlers.js';
import newProcessLogger from "../src/newProcessLogger.js";
import attachStatePrinter from "../src/attachStatePrinter.js";;

import config from "./productCatalogStatechart.js";

describe('combineHandlers', () => {

  function newPrintChecker() {
    const lines = [];
    return [lines, (...control) => expect(lines.map(items => items.join(''))).to.eql(control)];
  }

  it(`should combine independent handlers`, async () => {
    const [lines, checkLines] = newPrintChecker();

    const handler = combineHandlers(
      attachStatePrinter({ print: (...args) => lines.push(args), lineNumbers : true }),
      newProcessLogger({ prefix: "A:" }),
      newProcessLogger({ prefix: "B:" })
    );
    const process = initAsyncProcess({ config, handler, handleError: console.error });

    await process.next({ key: "start" });
    checkLines(
      '[1]A:<App event="start">',
      '[2]B:<App event="start">',
      '[3]  A:<ProductCatalog event="start">',
      '[4]  B:<ProductCatalog event="start">',
      '[5]    A:<ProductList event="start">',
      '[6]    B:<ProductList event="start">'
    )

    await process.next({ key: "showBasket" });
    checkLines(
      '[1]A:<App event="start">',
      '[2]B:<App event="start">',
      '[3]  A:<ProductCatalog event="start">',
      '[4]  B:<ProductCatalog event="start">',
      '[5]    A:<ProductList event="start">',
      '[6]    B:<ProductList event="start">',
      '[7]    A:</ProductList> <!-- event="showBasket" -->',
      '[8]    B:</ProductList> <!-- event="showBasket" -->',
      '[9]  A:</ProductCatalog> <!-- event="showBasket" -->',
      '[10]  B:</ProductCatalog> <!-- event="showBasket" -->',
      '[11]  A:<ProductBasket event="showBasket">',
      '[12]  B:<ProductBasket event="showBasket">',
      '[13]    A:<ShowSelectedProducts event="showBasket">',
      '[14]    B:<ShowSelectedProducts event="showBasket">'
    )

  })

});
