import { describe, expect, it } from "vitest";
import {
	EventQueueModel,
	setEventQueue,
} from "@/shared-process/event-queue/index.ts";
import { rootBridge } from "@/shared-process/root-bridge/index.ts";

describe("rootBridge", () => {
	it("yields events emitted to the EventQueueModel", async () => {
		const ctx: Record<string, unknown> = {};
		const eq = new EventQueueModel();
		setEventQueue(ctx, eq);

		const gen = rootBridge(ctx);

		eq.emit("a");
		eq.emit("b");

		const r1 = await gen.next();
		expect(r1.value).toBe("a");
		expect(r1.done).toBe(false);

		const r2 = await gen.next();
		expect(r2.value).toBe("b");
		expect(r2.done).toBe(false);

		await gen.return(undefined as never);
	});

	it("waits for events when queue is empty", async () => {
		const ctx: Record<string, unknown> = {};
		const eq = new EventQueueModel();
		setEventQueue(ctx, eq);

		const gen = rootBridge(ctx);

		const promise = gen.next();

		// event emitted after generator is waiting
		eq.emit("delayed");
		const result = await promise;
		expect(result.value).toBe("delayed");

		await gen.return(undefined as never);
	});

	it("yields events in order", async () => {
		const ctx: Record<string, unknown> = {};
		const eq = new EventQueueModel();
		setEventQueue(ctx, eq);

		const gen = rootBridge(ctx);

		const events = ["first", "second", "third"];
		for (const e of events) eq.emit(e);

		const results: string[] = [];
		for (let i = 0; i < events.length; i++) {
			const r = await gen.next();
			results.push(r.value as string);
		}
		expect(results).toEqual(events);

		await gen.return(undefined as never);
	});
});
