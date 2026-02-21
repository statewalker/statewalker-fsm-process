#!/usr/bin/env node
import { config } from "dotenv";

config(); // Load .env from cwd before any provider reads env vars

const { run } = await import("../src/cli/index.ts");
const code = await run(process.argv.slice(2));
process.exit(code);
