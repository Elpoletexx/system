#!/usr/bin/env node
// Roblox Studio Plus — MCP server (stdio, newline-delimited JSON-RPC 2.0).
// No dependencies: runs with any Node.js >= 18.

import readline from "node:readline";
import { StudioBridge } from "./bridge.mjs";
import { createServer } from "./mcp.mjs";

const DEFAULT_PORT = 44877;

const log = (msg) => process.stderr.write(`[roblox-studio-plus] ${msg}\n`);

function parsePort(raw) {
  if (raw === undefined || raw === "") return DEFAULT_PORT;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n < 65536 ? n : DEFAULT_PORT;
}

async function main() {
  const bridge = new StudioBridge({ port: parsePort(process.env.ROBLOX_STUDIO_PLUS_PORT), log });
  await bridge.listen();

  const write = (obj) => process.stdout.write(JSON.stringify(obj) + "\n");
  const server = createServer({ bridge, write });

  const rl = readline.createInterface({ input: process.stdin });
  rl.on("line", (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return write({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    }
    server.handle(msg).catch((err) => {
      log(`handler error: ${err.stack || err}`);
      if (msg.id !== undefined) write({ jsonrpc: "2.0", id: msg.id, error: { code: -32603, message: String(err.message || err) } });
    });
  });
  rl.on("close", async () => {
    await bridge.close();
    process.exit(0);
  });
}

main();
