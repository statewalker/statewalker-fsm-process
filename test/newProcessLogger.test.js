import { describe, it, expect } from "./deps.js";
import initAsyncProcess from "../src/initAsyncProcess.js";
import newProcessLogger from "../src/newProcessLogger.js";
import { initPrinter } from "../src/hooks.printer.js";
import config from "./productCatalogStatechart.js";

describe("newProcessLogger", () => {
  function newPrintChecker() {
    const lines = [];
    return [
      lines,
      (...control) =>
        expect(lines.map((items) => items.join(""))).toEqual(control),
    ];
  }

  it("should track transitions between states", async () => {
    const [lines, checkLines] = newPrintChecker();

    const process = initAsyncProcess({
      config,
      initialize: initPrinter({
        print: (...args) => lines.push(args),
        lineNumbers: true,
      }),
      handler: newProcessLogger(),
      handleError: console.error,
    });

    await process.next({ key: "start" });
    checkLines(
      '[1]<App event="start">',
      '[2]  <ProductCatalog event="start">',
      '[3]    <ProductList event="start">'
    );

    await process.next({ key: "showBasket" });
    checkLines(
      '[1]<App event="start">',
      '[2]  <ProductCatalog event="start">',
      '[3]    <ProductList event="start">',
      '[4]    </ProductList> <!-- event="showBasket" -->',
      '[5]  </ProductCatalog> <!-- event="showBasket" -->',
      '[6]  <ProductBasket event="showBasket">',
      '[7]    <ShowSelectedProducts event="showBasket">'
    );

    await process.next({ key: "back" });
    checkLines(
      '[1]<App event="start">',
      '[2]  <ProductCatalog event="start">',
      '[3]    <ProductList event="start">',
      '[4]    </ProductList> <!-- event="showBasket" -->',
      '[5]  </ProductCatalog> <!-- event="showBasket" -->',
      '[6]  <ProductBasket event="showBasket">',
      '[7]    <ShowSelectedProducts event="showBasket">',
      '[8]    </ShowSelectedProducts> <!-- event="back" -->',
      '[9]  </ProductBasket> <!-- event="back" -->',
      '[10]  <ProductCatalog event="back">',
      '[11]    <ProductList event="back">'
    );

    await process.next({ key: "exit" });
    checkLines(
      '[1]<App event="start">',
      '[2]  <ProductCatalog event="start">',
      '[3]    <ProductList event="start">',
      '[4]    </ProductList> <!-- event="showBasket" -->',
      '[5]  </ProductCatalog> <!-- event="showBasket" -->',
      '[6]  <ProductBasket event="showBasket">',
      '[7]    <ShowSelectedProducts event="showBasket">',
      '[8]    </ShowSelectedProducts> <!-- event="back" -->',
      '[9]  </ProductBasket> <!-- event="back" -->',
      '[10]  <ProductCatalog event="back">',
      '[11]    <ProductList event="back">',
      '[12]    </ProductList> <!-- event="exit" -->',
      '[13]  </ProductCatalog> <!-- event="exit" -->',
      '[14]</App> <!-- event="exit" -->'
    );
  });

  it("should be able to add a prefix to all lines", async () => {
    const [lines, checkLines] = newPrintChecker();
    const process = initAsyncProcess({
      config,
      config,
      initialize: initPrinter({
        print: (...args) => lines.push(args),
        lineNumbers: true,
        prefix: "abc",
      }),
      handler: newProcessLogger(),
      handleError: console.error,
    });

    await process.next({ key: "start" });
    checkLines(
      'abc[1]<App event="start">',
      'abc[2]  <ProductCatalog event="start">',
      'abc[3]    <ProductList event="start">'
    );

    await process.next({ key: "showBasket" });
    checkLines(
      'abc[1]<App event="start">',
      'abc[2]  <ProductCatalog event="start">',
      'abc[3]    <ProductList event="start">',
      'abc[4]    </ProductList> <!-- event="showBasket" -->',
      'abc[5]  </ProductCatalog> <!-- event="showBasket" -->',
      'abc[6]  <ProductBasket event="showBasket">',
      'abc[7]    <ShowSelectedProducts event="showBasket">'
    );
  });
});
