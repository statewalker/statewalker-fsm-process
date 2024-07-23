import { describe, it } from "./deps.ts";
import {
  getPrinter,
  getProcessPrinter,
  preparePrinter,
  Printer,
  type FsmStateConfig,
} from "@statewalker/fsm";
import catalog from "./process.ProductCatalog.ts";
import { newPrintChecker } from "./newPrintChecker.ts";
import { newProcess } from "./newProcess.ts";
import {
  DependenciesDeclarations,
  exposeAction,
  exposeService,
} from "../src/index.ts";
import { newServices } from "@statewalker/services";
const config = catalog as FsmStateConfig;

describe("dispatch state handlers", () => {
  it("should add services", async () => {
    const [print, checkLines] = newPrintChecker();
    const process = newProcess(config as FsmStateConfig, {
      print,
      lineNumbers: true,
    });
    type ActionHandler<T = any> = {
      dependencies?: DependenciesDeclarations<T>;
      action: (deps: () => AsyncGenerator<T | undefined>) => () => void;
    };
    type ServiceHandler<T = any, S = any> = {
      key: string;
      dependencies?: DependenciesDeclarations<T>;
      service: (
        deps: () => AsyncGenerator<T | undefined>
      ) => AsyncGenerator<S | undefined>;
    };
    function isServiceHandler<T>(s: any): s is ServiceHandler<T> {
      if (s.service && s.key) return true;
      return false;
    }
    function isActionHandler<T>(s: any): s is ActionHandler<T> {
      if (s.action) return true;
      return false;
    }
    const handlers: Record<string, ActionHandler | ServiceHandler> = {
      "*": {
        dependencies: {
          printer: [1, 1],
        },
        action(deps) {
          let print: Printer;
          (async () => {
            for await (const p of deps()) {
              if (!p) continue;
              print = p.printer;
            } 
          })();
          return () => {
            print?.("EXIT");
          };
        },
      } as ActionHandler<{ printer: Printer }>,
    };

    const services = newServices();
    const printer = getProcessPrinter(process);
    services.newProvider("printer", printer);

    process.onStateCreate((state) => {
      const handler = handlers[state.key] || handlers["*"];
      if (!handler) return;
      let cleanup: undefined | (() => void);
      state.onEnter(() => {
        if (isServiceHandler(handler)) {
          cleanup = exposeService({
            services,
            ...handler,
          });
        } else if (isActionHandler(handler)) {
          cleanup = exposeAction({
            services,
            ...handler,
          });
        }
      });
      state.onExit(() => cleanup?.());
    });
  });

  it("should track transitions between states", async () => {
    const [print, checkLines] = newPrintChecker();
    const process = newProcess(config as FsmStateConfig, {
      print,
      lineNumbers: true,
    });

    await process.dispatch("start");
    checkLines(
      '[1]<App event="start">',
      '[2]  <ProductCatalog event="start">',
      '[3]    <ProductList event="start">'
    );

    await process.dispatch("showBasket");
    checkLines(
      '[1]<App event="start">',
      '[2]  <ProductCatalog event="start">',
      '[3]    <ProductList event="start">',
      '[4]    </ProductList> <!-- event="showBasket" -->',
      '[5]  </ProductCatalog> <!-- event="showBasket" -->',
      '[6]  <ProductBasket event="showBasket">',
      '[7]    <ShowSelectedProducts event="showBasket">'
    );

    await process.dispatch("back");
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

    await process.dispatch("exit");
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
});
