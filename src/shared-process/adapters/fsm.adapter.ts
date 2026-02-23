import { newAdapter } from "@/shared/adapters/index.ts";
import { BaseClass, readValues } from "@/shared/base-class";

// -----------------------------------------------------------
// FSM parameters, stored by the FSM engine in the context during the execution.
// It uses "well-known" keys to avoid conflicts with user-defined context properties.

// Returns the current stack of states being processed.
export const [getFsmStack] = newAdapter<string[]>("fsm:states", () => []);

// Returns the current event being processed, or null if no event is being processed.
export const [getFsmEvent] = newAdapter<string | null>("fsm:event", () => null);

// -----------------------------------------------------------
// -----------------------------------------------------------
// Additional utility adapters, allowing to enqueue events for the FSM to process.

export class EventModel extends BaseClass {
  #event: string | null = null;
  get event(): string | null {
    return this.#event;
  }

  readEvents: () => AsyncGenerator<string> = () =>
    readValues((cb) => this.onUpdate(cb), () => {
      if (this.#event) {
        return this.#event;
      }
    });

  emit(event: string): void {
    if (event) {
      this.#event = event;
      this.notify();
    }
  }
}

export const [getEvents] = newAdapter<EventModel>(
  "fsm:event-model",
  () => new EventModel(),
);
