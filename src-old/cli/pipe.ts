/**
 * Read all data from stdin if it's being piped (not a TTY).
 * Returns the trimmed string or undefined if stdin is a TTY.
 */
export async function readStdin(): Promise<string | undefined> {
  if (process.stdin.isTTY) return undefined;

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  const data = Buffer.concat(chunks).toString("utf-8").trim();
  return data || undefined;
}
