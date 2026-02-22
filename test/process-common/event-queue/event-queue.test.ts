import { describe, expect, it } from "vitest";
import {
	EventQueueModel,
	getEventQueue,
	setEventQueue,
} from "../../../src/process-common/event-queue/index.ts";

describe("EventQueueModel", () => {
	it("emit before read: queue buffers the event", async () => {
		const eq = new EventQueueModel();
		eq.emit("a");
		eq.emit("b");
		const gen = eq.read();
		expect((await gen.next()).value).toBe("a");
		expect((await gen.next()).value).toBe("b");
		await gen.return(undefined as never);
	});

	it("read before emit: waiter resolves when event is emitted", async () => {
		const eq = new EventQueueModel();
		const gen = eq.read();
		const promise = gen.next();
		eq.emit("x");
		expect((await promise).value).toBe("x");
		await gen.return(undefined as never);
	});

	it("interleaved emit/read", async () => {
		const eq = new EventQueueModel();
		const gen = eq.read();

		eq.emit("1");
		expect((await gen.next()).value).toBe("1");

		const p = gen.next();
		eq.emit("2");
		expect((await p).value).toBe("2");

		eq.emit("3");
		eq.emit("4");
		expect((await gen.next()).value).toBe("3");
		expect((await gen.next()).value).toBe("4");

		await gen.return(undefined as never);
	});

	it("read() returns an async generator", () => {
		const eq = new EventQueueModel();
		const gen = eq.read();
		expect(typeof gen.next).toBe("function");
		expect(typeof gen.return).toBe("function");
		expect(typeof gen[Symbol.asyncIterator]).toBe("function");
	});

	it("adapter pair creates default EventQueueModel", () => {
		const ctx: Record<string, unknown> = {};
		const eq = getEventQueue(ctx);
		expect(eq).toBeInstanceOf(EventQueueModel);
	});

	it("adapter pair set/get roundtrip", () => {
		const ctx: Record<string, unknown> = {};
		const eq = new EventQueueModel();
		setEventQueue(ctx, eq);
		expect(getEventQueue(ctx)).toBe(eq);
	});
});
