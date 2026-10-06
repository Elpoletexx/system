// Run with: node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { StudioBridge } from "../server/bridge.mjs";
import { createServer, validateArgs } from "../server/mcp.mjs";
import { TOOLS } from "../server/tools.mjs";

async function startBridge() {
  const bridge = new StudioBridge({ port: 0 });
  assert.equal(await bridge.listen(), true);
  return bridge;
}

// Fake Studio plugin: polls once and answers with `respond(command)`.
async function fakeStudioOnce(bridge, respond) {
  const base = `http://127.0.0.1:${bridge.port}`;
  const res = await fetch(`${base}/poll`);
  if (res.status === 204) return null;
  const command = await res.json();
  const reply = await respond(command);
  await fetch(`${base}/result`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: command.id, ...reply }),
  });
  return command;
}

test("every tool has a valid schema and unique name", () => {
  const names = new Set();
  for (const t of TOOLS) {
    assert.ok(!names.has(t.name), `duplicate ${t.name}`);
    names.add(t.name);
    assert.equal(t.inputSchema.type, "object");
    for (const r of t.inputSchema.required ?? []) assert.ok(t.inputSchema.properties[r], `${t.name}.${r}`);
  }
});

test("validateArgs rejects bad input before it reaches Studio", () => {
  const schema = TOOLS.find((t) => t.name === "edit_script").inputSchema;
  assert.match(validateArgs(schema, { path: "A" }), /missing required argument 'oldText'/);
  assert.match(validateArgs(schema, { path: 1, oldText: "a", newText: "b" }), /'path' must be of type string/);
  assert.match(validateArgs(schema, { path: "A", oldText: "", newText: "b" }), /must not be empty/);
  assert.match(validateArgs(schema, { path: "A", oldText: "a", newText: "b", evil: 1 }), /unknown argument 'evil'/);
  assert.equal(validateArgs(schema, { path: "A", oldText: "a", newText: "b" }), null);
  const del = TOOLS.find((t) => t.name === "delete_instances").inputSchema;
  assert.match(validateArgs(del, { paths: [] }), /at least 1/);
  assert.match(validateArgs(del, { paths: [1] }), /array of strings/);
});

test("tool call round-trips through the bridge", async () => {
  const bridge = await startBridge();
  const server = createServer({ bridge, write: () => {} });
  bridge.lastPollAt = Date.now(); // pretend Studio polled recently

  const studio = fakeStudioOnce(bridge, (cmd) => {
    assert.equal(cmd.tool, "get_tree");
    assert.deepEqual(cmd.args, { path: "Workspace", depth: 1 });
    return { ok: true, result: { name: "Workspace", className: "Workspace", childCount: 0 } };
  });
  const result = await server.callTool("get_tree", { path: "Workspace", depth: 1 });
  await studio;
  assert.equal(result.isError, undefined);
  assert.match(result.content[0].text, /"className": "Workspace"/);
  await bridge.close();
});

test("Studio errors surface as tool errors", async () => {
  const bridge = await startBridge();
  const server = createServer({ bridge, write: () => {} });
  bridge.lastPollAt = Date.now();
  const studio = fakeStudioOnce(bridge, () => ({ ok: false, error: "path not found: 'Workspace.Nope'" }));
  const result = await server.callTool("get_properties", { path: "Workspace.Nope" });
  await studio;
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /path not found/);
  await bridge.close();
});

test("script source is returned with line numbers", async () => {
  const bridge = await startBridge();
  const server = createServer({ bridge, write: () => {} });
  bridge.lastPollAt = Date.now();
  const studio = fakeStudioOnce(bridge, () => ({
    ok: true,
    result: { path: "ServerScriptService.Main", startLine: 10, source: "local a = 1\nprint(a)" },
  }));
  const result = await server.callTool("read_script", { path: "ServerScriptService.Main", startLine: 10 });
  await studio;
  assert.match(result.content[0].text, /   10\tlocal a = 1\n   11\tprint\(a\)/);
  await bridge.close();
});

test("calls fail fast when Studio is not connected", async () => {
  const bridge = await startBridge();
  const server = createServer({ bridge, write: () => {} });
  const result = await server.callTool("get_selection", {});
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /not connected/);
  const status = await server.callTool("studio_status", {});
  assert.equal(status.isError, true);
  await bridge.close();
});

test("bridge rejects browser-origin and foreign-host requests", async () => {
  const bridge = await startBridge();
  const base = `http://127.0.0.1:${bridge.port}`;
  const withOrigin = await fetch(`${base}/health`, { headers: { Origin: "https://evil.example" } });
  assert.equal(withOrigin.status, 403);
  const ok = await fetch(`${base}/health`);
  assert.equal(ok.status, 200);
  const unknown = await fetch(`${base}/result`, { method: "POST", body: JSON.stringify({ id: "nope", ok: true }) });
  assert.equal(unknown.status, 404);
  await bridge.close();
});

test("stdio server answers initialize and tools/list", async () => {
  const entry = fileURLToPath(new URL("../server/index.mjs", import.meta.url));
  const child = spawn(process.execPath, [entry], { env: { ...process.env, ROBLOX_STUDIO_PLUS_PORT: "0" } });
  const lines = [];
  let buffer = "";
  const got = new Promise((resolve) => {
    child.stdout.on("data", (d) => {
      buffer += d;
      let i;
      while ((i = buffer.indexOf("\n")) >= 0) {
        lines.push(JSON.parse(buffer.slice(0, i)));
        buffer = buffer.slice(i + 1);
        if (lines.length === 2) resolve();
      }
    });
  });
  const send = (m) => child.stdin.write(JSON.stringify(m) + "\n");
  send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "0" } } });
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  await got;
  child.stdin.end();
  assert.equal(lines[0].result.protocolVersion, "2025-06-18");
  assert.equal(lines[0].result.serverInfo.name, "roblox-studio-plus");
  assert.equal(lines[1].result.tools.length, TOOLS.length);
  assert.ok(lines[1].result.tools.every((t) => !("local" in t) && !("timeoutMs" in t)));
});
