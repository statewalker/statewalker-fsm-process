import { describe, it, expect, beforeEach, afterEach } from "../deps.ts";
// import { getPrinter, setProcessPrinter } from "@statewalker/fsm";
import { newServices, type Services } from "@statewalker/services";
import { listen } from "@agen/utils";
import { newRegistry } from "../newRegistry.ts";
import { newPromise } from "../newPromise.ts";
import {
  type ActionConfig,
  type ServiceConfig,
  exposeAction,
  exposeService,
} from "../../src/index.ts";

describe("exposeAction / exposeService", () => {
  let register: (action?: () => unknown) => () => void;
  let clean: () => void;
  let services: Services;
  beforeEach(() => {
    [register, clean] = newRegistry();
    services = newServices();
    register(services.close);
  });
  afterEach(() => {
    clean?.();
  });

  describe("exposeAction", () => {
    it("should recieve notifications on service updates", async () => {
      type TestConfig = {
        message: string;
      };
      type TestPrinter = (...args: string[]) => void;

      let lines: string[] = [];
      const configProvider = services.newProvider<TestConfig>("config");

      register(configProvider.close);
      register(
        services.newProvider<TestPrinter>("printer", (...args: string[]) => {
          lines.push(args.join(" "));
        }).close
      );
      let [promise, resolve] = newPromise();
      register(
        exposeAction<{
          config: TestConfig;
          printer: TestPrinter;
        }>({
          services,
          dependencies: {
            config: [1, 1],
            printer: [1, 1],
          },
          action: (deps) =>
            listen(deps, (d) => {
              if (!d) return;
              const { printer, config } = d;
              printer(config.message);
              resolve();
            }),
        })
      );
      configProvider({
        message: "Hello 0",
      });
      await promise;
      expect(lines).toEqual(["Hello 0"]);

      [promise, resolve] = newPromise();
      configProvider({
        message: "Hello 1",
      });
      await promise;
      expect(lines).toEqual(["Hello 0", "Hello 1"]);

      [promise, resolve] = newPromise();
      configProvider({
        message: "Hello 2",
      });
      await promise;
      expect(lines).toEqual(["Hello 0", "Hello 1", "Hello 2"]);
    });
  });

  describe("exposeService", () => {
    it("should provide services without explicit dependencies", async () => {
      let lines: string[] = [];
      // Listen registered services and add them to the control list
      register(
        services.newConsumer<string>("message", (d) => {
          if (!d || !d[0]) return;
          const [message] = d;
          lines.push(message);
        })
      );

      const control: string[] = [];
      for (let i = 0; i < 10; i++) {
        control.push("Hello - " + i);
      }
      let [promise, resolve] = newPromise();
      register(
        exposeService<string>({
          services,
          key: "message",
          service: async function* (deps) {
            for (let i = 0; i < control.length; i++) {
              yield control[i];
              await new Promise((r) => setTimeout(r, 1));
            }
            resolve();
          },
        })
      );

      await promise;
      expect(lines).toEqual(control);
    });

    it("should provide new services when depenencies are resolved", async () => {
      type TestConfig = {
        message: string;
      };

      let [promise, resolve] = newPromise();
      let lines: string[] = [];
      const configProvider = services.newProvider<TestConfig>("config");
      register(configProvider.close);

      register(
        services.newConsumer<string>("message", (d) => {
          if (!d || !d[0]) return;
          const [message] = d;
          lines.push(message);
          resolve();
        })
      );

      register(
        exposeService<
          string,
          {
            config: TestConfig;
          }
        >({
          services,
          key: "message",
          dependencies: {
            config: [1, 1],
          },
          service: async function* (deps) {
            for await (const d of deps()) {
              const config = d?.config;
              if (!config?.message) continue;
              yield config.message.toUpperCase();
            }
          },
        })
      );

      configProvider({
        message: "Hello 0",
      });
      await promise;
      expect(lines).toEqual(["HELLO 0"]);

      [promise, resolve] = newPromise();
      configProvider({
        message: "Hello 1",
      });
      await promise;
      expect(lines).toEqual(["HELLO 0", "HELLO 1"]);

      [promise, resolve] = newPromise();
      configProvider({
        message: "Hello 2",
      });
      await promise;
      expect(lines).toEqual(["HELLO 0", "HELLO 1", "HELLO 2"]);
    });

    it("should provide simple services and consume them in actions", async () => {
      let [promise, resolve] = newPromise();
      let lines: string[] = [];

      register(
        exposeAction<{ message: string }>({
          services,
          dependencies: {
            message: [1, 1],
          },
          action: (deps) =>
            listen(deps, (d) => {
              if (!d) return;
              lines.push(d.message);
            }),
        })
      );

      const control: string[] = [];
      for (let i = 0; i < 10; i++) {
        control.push("Hello - " + i);
      }

      register(
        exposeService<string>({
          services,
          key: "message",
          service: async function* () {
            for (let i = 0; i < control.length; i++) {
              yield control[i];
              await new Promise((r) => setTimeout(r, 0));
            }
            resolve();
          },
        })
      );
      await promise;
      expect(lines).toEqual(control);
    });
  });

  it("should manage inter-service dependencies and consume them in actions", async () => {
    let [promise, resolve] = newPromise();
    let lines: string[] = [];

    type Printer = {
      print: (...messages: string[]) => void;
    };
    type NotificationMessage = {
      id: number;
      data: string;
      brand: string;
    };
    const messageList: string[] = [];

    const dataControl: string[] = [];
    for (let i = 0; i < 10; i++) {
      dataControl.push("Hello - " + i);
    }

    const serviceList: (ServiceConfig<any> | ActionConfig<any>)[] = [
      {
        dependencies: {
          printer: [1, 1],
          notification: [1, 1],
        },
        action: async function (
          deps: () => AsyncGenerator<{
            printer: Printer;
            notification: NotificationMessage;
          }>
        ) {
          for await (let d of deps()) {
            if (!d) continue;
            const { printer, notification } = d;
            const { id, data, brand } = notification;
            printer.print(`id="${id}" data="${data}" brand="${brand}"`);
          }
        },
      },
      {
        key: "printer",
        service: async function* (): AsyncGenerator<Printer> {
          yield {
            print: (...messages: string[]) => {
              messageList.push(messages.join(" "));
            },
          };
        },
      },
      {
        key: "notification",
        dependencies: {
          data: [1, 1],
          brand: [1, 1],
        },
        service: async function* (
          dependencies
        ): AsyncGenerator<NotificationMessage> {
          const deps = dependencies as () => AsyncGenerator<{
            data: string;
            brand: string;
          }>;
          let id = 0;
          for await (const d of deps()) {
            if (!d) continue;
            const { data, brand } = d;
            yield {
              id: id++,
              data,
              brand,
            };
          }
        },
      },
      {
        key: "brand",
        service: async function* () {
          yield "My Company";
        },
      },
    ];

    function isServiceConfig(config: any): config is ServiceConfig<any> {
      if (!!config.key && !!config.service) return true;
      return false;
    }

    function isActionConfig(config: any): config is ActionConfig<any> {
      if (!!config.action) return true;
      return false;
    }

    for (const config of serviceList) {
      if (isServiceConfig(config)) {
        register(
          exposeService({
            ...config,
            services,
          })
        );
      } else if (isActionConfig(config)) {
        register(
          exposeAction({
            ...config,
            services,
          })
        );
      }
    }
    const r = register(
      exposeService({
        services,
        key: "data",
        service: async function* () {
          for (let i = 0; i < dataControl.length; i++) {
            yield dataControl[i];
            await new Promise((r) => setTimeout(r, 1));
          }
          resolve();
          r(); // Remove itself from the list of services
        },
      })
    );

    // services.newConsumer<string>("data", (data) => {
    //   console.log('DATA:', data);
    // })

    await promise;

    r();
    await new Promise((r) => setTimeout(r, 10));

    expect(messageList).toEqual([
      'id="0" data="Hello - 0" brand="My Company"',
      'id="1" data="Hello - 1" brand="My Company"',
      'id="2" data="Hello - 2" brand="My Company"',
      'id="3" data="Hello - 3" brand="My Company"',
      'id="4" data="Hello - 4" brand="My Company"',
      'id="5" data="Hello - 5" brand="My Company"',
      'id="6" data="Hello - 6" brand="My Company"',
      'id="7" data="Hello - 7" brand="My Company"',
      'id="8" data="Hello - 8" brand="My Company"',
      'id="9" data="Hello - 9" brand="My Company"',
    ]);
  });
});

// function publishService<S = any>(state: FsmState, key: string, service: S) {
//   const services = getServices(state.process);
//   let provider: ServiceProvider<S> | undefined;
//   state.onEnter(() => {
//     provider = services.newProvider<S>(key);
//     provider(service);
//   });
//   state.onExit(() => provider?.close());
// }

// async function* useDependencies1<T extends Record<string, any>>(
//   services: Services,
//   dependencies?: Record<keyof T, Cardinality>
// ): AsyncGenerator<T | undefined> {
//   yield* iterate<T | undefined>((o) => {
//     return resolveDependencies<T>({
//       services,
//       dependencies,
//       activate: (values: T) => {
//         o.next(values);
//       },
//       update: (values: T) => {
//         o.next(values);
//       },
//       deactivate: () => {
//         o.complete();
//       },
//     });
//   });
// }

// function useServices<T extends Record<string, any>>(
//   state: FsmState,
//   dependencies: Record<keyof T, Cardinality>,
//   action: (
//     dependencies: () => AsyncIterable<T | undefined>
//   ) => (unknown | (() => void)) | Promise<unknown | (() => void)>
// ) {
//   let slot: Slot<T | undefined>;
//   let close: (() => void) | unknown;
//   state.onEnter(async () => {
//     const services = getServices(state.process);
//     slot = useDependencies(services, dependencies);
//     close = await action(slot);
//   });
//   state.onExit(async () => {
//     if (typeof close === "function") {
//       await close();
//     }
//     await slot?.observer.complete();
//   });
// }

// function exposeServices<S, T extends Record<string, any>>(
//   state: FsmState,
//   dependencies: Record<keyof T, Cardinality>,
//   key: string,
//   action: (
//     dependencies: () => AsyncIterable<T | undefined>
//   ) => AsyncGenerator<S>
// ) {
//   useServices(state, dependencies, key, async (deps) => {
//     (async () => {})();
//     return;
//   });
//   let slot: Slot<T | undefined>;
//   let close: (() => void) | unknown;
//   state.onEnter(async () => {
//     const services = getServices(state.process);
//     slot = useDependencies(services, dependencies);
//     close = await action(slot);
//   });
//   state.onExit(async () => {
//     if (typeof close === "function") {
//       await close();
//     }
//     await slot?.observer.complete();
//   });
// }
