import { getEventQueue } from "@/shared-process/event-queue/index.ts";

export async function* rootBridge(
	context: Record<string, unknown>,
): AsyncGenerator<string> {
	const events = getEventQueue(context);
	yield* events.read();
}
