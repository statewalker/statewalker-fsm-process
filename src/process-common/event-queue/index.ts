import { newAdapter } from "../../commons/adapters/index.ts";

export class EventQueueModel {
	private _queue: string[] = [];
	private _waiter: ((event: string) => void) | null = null;

	constructor() {
		this.read = this.read.bind(this);
	}

	emit(event: string): void {
		if (this._waiter) {
			const resolve = this._waiter;
			this._waiter = null;
			resolve(event);
		} else {
			this._queue.push(event);
		}
	}

	private next(): Promise<string> {
		if (this._queue.length > 0) {
			return Promise.resolve(this._queue.shift() as string);
		}
		return new Promise<string>((resolve) => {
			this._waiter = resolve;
		});
	}

	async *read() {
		while (true) {
			const event = await this.next();
			yield event;
		}
	}
}

export const [getEventQueue, setEventQueue] = newAdapter<EventQueueModel>(
	"event-queue",
	() => new EventQueueModel(),
);
