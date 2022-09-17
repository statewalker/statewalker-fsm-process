import expect from 'expect.js';
import initAsyncProcess from "../src/initAsyncProcess.js";
import combineHandlers from '../src/combineHandlers.js';
import newProcessLogger from "../src/newProcessLogger.js"

import config from "./productCatalogStatechart.js";

describe('combineHandlers', () => {

  function newPrintChecker() {
    const lines = [];
    return [lines, (...control) => expect(lines.map(items => items.join(''))).to.eql(control)];
  }

  it(`should combine independent handlers`, async () => {
    const [lines, checkLines] = newPrintChecker();

    const handler = combineHandlers(
      newProcessLogger({ log: (...args) => lines.push(args), prefix : "A:" }),
      newProcessLogger({ log: (...args) => lines.push(args), prefix : "B:" })
    );
    const process = initAsyncProcess({ config, handler, handleError: console.error });

    await process.next({ key: "start" });
    checkLines(
      'A:[1]<App event="start">',
      'B:[1]<App event="start">',
      'A:[2]  <ProductCatalog event="start">',
      'B:[2]  <ProductCatalog event="start">',
      'A:[3]    <ProductList event="start">',
      'B:[3]    <ProductList event="start">'
    )

    await process.next({ key: "showBasket" });
    checkLines(
      'A:[1]<App event="start">',
      'B:[1]<App event="start">',
      'A:[2]  <ProductCatalog event="start">',
      'B:[2]  <ProductCatalog event="start">',
      'A:[3]    <ProductList event="start">',
      'B:[3]    <ProductList event="start">',
      'A:[4]    </ProductList> <!-- event="showBasket" -->',
      'B:[4]    </ProductList> <!-- event="showBasket" -->',
      'A:[5]  </ProductCatalog> <!-- event="showBasket" -->',
      'B:[5]  </ProductCatalog> <!-- event="showBasket" -->',
      'A:[6]  <ProductBasket event="showBasket">',
      'B:[6]  <ProductBasket event="showBasket">',
      'A:[7]    <ShowSelectedProducts event="showBasket">',
      'B:[7]    <ShowSelectedProducts event="showBasket">'
    )

  })

});
