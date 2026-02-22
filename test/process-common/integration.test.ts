import type { FsmStateConfig } from "@statewalker/fsm-validator";
import { describe, expect, it } from "vitest";
import { setConfig } from "../../src/process-common/adapters/config/index.ts";
import { setLogger } from "../../src/process-common/adapters/logger/index.ts";
import {
	EventQueueModel,
	setEventQueue,
} from "../../src/process-common/event-queue/index.ts";
import { createHandlerLoader } from "../../src/process-common/handler-loader/index.ts";
import { rootBridge } from "../../src/process-common/root-bridge/index.ts";
import { runProcess } from "../../src/process-common/run-process/index.ts";

const toggleConfig: FsmStateConfig = {
	key: "Toggle",
	transitions: [
		["", "*", "Off"],
		["Off", "flip", "On"],
		["On", "flip", "Off"],
		["Off", "stop", ""],
	],
	states: [
		{ key: "Off", events: { flip: "turn on", stop: "halt" } },
		{ key: "On", events: { flip: "turn off" } },
	],
};

describe("integration: handler emits -> root bridge yields -> FSM transitions", () => {
	it("handler emits events that drive FSM through states", async () => {
		const visited: string[] = [];
		const eq = new EventQueueModel();
		const ctx: Record<string, unknown> = {};
		setEventQueue(ctx, eq);
		setConfig(ctx, toggleConfig);
		setLogger(ctx, {
			log: () => {},
			error: () => {},
			warn: () => {},
			debug: () => {},
		});

		// Track which leaf states were visited via a handler that emits events
		const leafHandler = (context: Record<string, unknown>) => {
			const stack = context["fsm:states"] as string[];
			const state = stack[stack.length - 1];
			visited.push(state);

			if (state === "Off" && visited.length === 1) {
				eq.emit("flip");
			} else if (state === "On") {
				eq.emit("flip");
			} else {
				// second Off -> stop
				eq.emit("stop");
			}
		};

		const load = createHandlerLoader(
			toggleConfig,
			{ Toggle: [rootBridge] },
			leafHandler,
		);

		const { done } = await runProcess({
			config: toggleConfig,
			context: ctx,
			load,
		});
		await done;

		expect(visited).toEqual(["Off", "On", "Off"]);
	});
});
