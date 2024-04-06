import { describe, it, expect } from "./deps.js";
import { initAsyncProcess } from "../src/index.js";
import config from "./productCatalogStatechart.js";
import { usePrinter, initPrinter } from "../src/hooks.printer.js";
import { onActivate, useEventKey, useStateKey } from "../src/hooks.js";

function newPrintChecker() {
  const lines = [];
  return [
    lines,
    (...control) =>
      expect(lines.map((items) => items.join(""))).toEqual(control),
  ];
}

describe("initPrinter", () => {
  it(`should allow to re-define the print method`, async () => {
    const [lines, checkLines] = newPrintChecker();
    let error;
    const process = initAsyncProcess({
      config,
      initialize: initPrinter({ print: (...args) => lines.push(args) }),
      handler: () => {
        const print = usePrinter();
        const getEventKey = useEventKey();
        onActivate(({ key }) => print("* ", key, ": ", getEventKey()));
        expect(typeof print).toBe("function");
      },
      handleError: (e) => (error = e),
    });

    await process.next({ key: "start" });
    if (error) throw error;
    checkLines(
      "* App: start",
      "  * ProductCatalog: start",
      "    * ProductList: start"
    );

    await process.next({ key: "showBasket" });
    if (error) throw error;
    checkLines(
      "* App: start",
      "  * ProductCatalog: start",
      "    * ProductList: start",
      "  * ProductBasket: showBasket",
      "    * ShowSelectedProducts: showBasket"
    );

    await process.next({ key: "back" });
    if (error) throw error;
    checkLines(
      "* App: start",
      "  * ProductCatalog: start",
      "    * ProductList: start",
      "  * ProductBasket: showBasket",
      "    * ShowSelectedProducts: showBasket",
      "  * ProductCatalog: back",
      "    * ProductList: back"
    );

    await process.next({ key: "exit" });
    if (error) throw error;
    checkLines(
      "* App: start",
      "  * ProductCatalog: start",
      "    * ProductList: start",
      "  * ProductBasket: showBasket",
      "    * ShowSelectedProducts: showBasket",
      "  * ProductCatalog: back",
      "    * ProductList: back"
    );
  });

  it(`should track transitions between states`, async () => {
    const [lines, checkLines] = newPrintChecker();

    let error;
    const process = initAsyncProcess({
      config,
      initialize: initPrinter({ print: (...args) => lines.push(args) }),
      handler: () => {
        const print = usePrinter();
        const getEventKey = useEventKey();
        const stateKey = useStateKey();
        onActivate(() => print("* ", stateKey, ": ", getEventKey()));
        expect(typeof print).toBe("function");
      },
      handleError: (e) => (error = e),
    });

    await process.next({ key: "start" });
    if (error) throw error;
    checkLines(
      "* App: start",
      "  * ProductCatalog: start",
      "    * ProductList: start"
    );

    await process.next({ key: "showBasket" });
    if (error) throw error;
    checkLines(
      "* App: start",
      "  * ProductCatalog: start",
      "    * ProductList: start",
      "  * ProductBasket: showBasket",
      "    * ShowSelectedProducts: showBasket"
    );

    await process.next({ key: "back" });
    if (error) throw error;
    checkLines(
      "* App: start",
      "  * ProductCatalog: start",
      "    * ProductList: start",
      "  * ProductBasket: showBasket",
      "    * ShowSelectedProducts: showBasket",
      "  * ProductCatalog: back",
      "    * ProductList: back"
    );

    await process.next({ key: "exit" });
    if (error) throw error;
    checkLines(
      "* App: start",
      "  * ProductCatalog: start",
      "    * ProductList: start",
      "  * ProductBasket: showBasket",
      "    * ShowSelectedProducts: showBasket",
      "  * ProductCatalog: back",
      "    * ProductList: back"
    );
  });
});
