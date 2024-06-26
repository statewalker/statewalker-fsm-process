import { describe, it, expect } from "./deps.js";
import initAsyncProcess from "../src/initAsyncProcess.js";
import { onActivate, onDeactivate } from "../src/hooks.js";
import { initPrinter } from "../src/hooks.printer.js";

import newProcessLogger from "../src/newProcessLogger.js";

import config from "./productCatalogStatechart.js";

describe("handlers.js", () => {
  function newPrintChecker() {
    const lines = [];
    return [
      (...args) => lines.push(args),
      (...control) =>
        expect(lines.map((items) => items.join(""))).toEqual(control),
    ];
  }

  it(`array of handlers`, async () => {
    const [print, checkLines] = newPrintChecker();

    const process = initAsyncProcess({
      config,
      initialize: initPrinter({ print, lineNumbers: true }),
      handler: [
        newProcessLogger({ prefix: "A:" }),
        newProcessLogger({ prefix: "B:" }),
      ],
      handleError: console.error,
    });

    await process.next({ key: "start" });
    checkLines(
      '[1]A:<App event="start">',
      '[2]B:<App event="start">',
      '[3]  A:<ProductCatalog event="start">',
      '[4]  B:<ProductCatalog event="start">',
      '[5]    A:<ProductList event="start">',
      '[6]    B:<ProductList event="start">'
    );

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
    );
  });

  it(`object with individual state handlers `, async () => {
    const [print, checkLines] = newPrintChecker();

    const process = initAsyncProcess({
      config,
      handler: {
        App: () => {
          onActivate(() => print("-> App"));
          onDeactivate(() => print("<- App"));
        },
        ProductList: () => {
          onActivate(() => print("  -> ProductList"));
          onDeactivate(() => print("  <- ProductList"));
        },
      },
      handleError: console.error,
    });

    await process.next({ key: "start" });
    checkLines("-> App", "  -> ProductList");

    await process.next({ key: "showBasket" });
    checkLines("-> App", "  -> ProductList", "  <- ProductList");
  });
});
