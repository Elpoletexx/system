// MCP request handling (JSON-RPC 2.0), independent of the transport.

import { TOOLS, TOOL_BY_NAME, BATCH_BLOCKED } from "./tools.mjs";

export const SERVER_INFO = { name: "roblox-studio-plus", version: "0.6.0" };
const DEFAULT_TIMEOUT_MS = 60_000;
const SUPPORTED_PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"];

// Minimal JSON-schema check (type + required) so obviously bad calls never reach Studio.
export function validateArgs(schema, args) {
  if (args === undefined || args === null) args = {};
  if (typeof args !== "object" || Array.isArray(args)) return "arguments must be an object";
  for (const key of schema.required ?? []) {
    if (args[key] === undefined) return `missing required argument '${key}'`;
  }
  for (const [key, value] of Object.entries(args)) {
    const prop = schema.properties?.[key];
    if (!prop) return `unknown argument '${key}'`;
    const t = prop.type;
    const ok =
      t === undefined ||
      (t === "string" && typeof value === "string") ||
      (t === "number" && typeof value === "number" && Number.isFinite(value)) ||
      (t === "integer" && Number.isInteger(value)) ||
      (t === "boolean" && typeof value === "boolean") ||
      (t === "array" && Array.isArray(value)) ||
      (t === "object" && typeof value === "object" && value !== null && !Array.isArray(value));
    if (!ok) return `argument '${key}' must be of type ${t}`;
    if (t === "array" && prop.items?.type === "string" && !value.every((v) => typeof v === "string")) {
      return `argument '${key}' must be an array of strings`;
    }
    if (t === "string" && prop.minLength && value.length < prop.minLength) return `argument '${key}' must not be empty`;
    if (t === "array" && prop.minItems && value.length < prop.minItems) return `argument '${key}' needs at least ${prop.minItems} item(s)`;
    if (prop.enum && !prop.enum.includes(value)) return `argument '${key}' must be one of ${prop.enum.join(", ")}`;
  }
  if (schema.properties?.steps && Array.isArray(args.steps)) {
    if (args.steps.length > (schema.properties.steps.maxItems ?? Infinity)) return "too many steps";
    for (const [i, step] of args.steps.entries()) {
      if (!step || typeof step !== "object" || typeof step.tool !== "string") return `step ${i + 1} needs a 'tool'`;
      const inner = TOOL_BY_NAME.get(step.tool);
      if (!inner) return `step ${i + 1}: unknown tool '${step.tool}'`;
      if (BATCH_BLOCKED.has(step.tool) || inner.local) return `step ${i + 1}: '${step.tool}' cannot run inside batch`;
      const problem = validateArgs(inner.inputSchema, step.args);
      if (problem) return `step ${i + 1} (${step.tool}): ${problem}`;
    }
  }
  return null;
}

// Render script source with line numbers so edits can quote it exactly.
function formatResult(result) {
  if (result && typeof result === "object" && typeof result.source === "string") {
    const { source, ...meta } = result;
    const first = Number.isInteger(meta.startLine) ? meta.startLine : 1;
    const numbered = source
      .split("\n")
      .map((line, i) => `${String(first + i).padStart(5)}\t${line}`)
      .join("\n");
    return `${JSON.stringify(meta, null, 2)}\n---\n${numbered}`;
  }
  return typeof result === "string" ? result : JSON.stringify(result ?? null, null, 2);
}

export function createServer({ bridge, write }) {
  const reply = (id, result) => write({ jsonrpc: "2.0", id, result });
  const fail = (id, code, message) => write({ jsonrpc: "2.0", id, error: { code, message } });

  async function callTool(name, args) {
    const tool = TOOL_BY_NAME.get(name);
    if (!tool) return { isError: true, content: [{ type: "text", text: `Unknown tool '${name}'` }] };
    const problem = validateArgs(tool.inputSchema, args);
    if (problem) return { isError: true, content: [{ type: "text", text: `Invalid arguments for ${name}: ${problem}` }] };

    if (name === "studio_status" && !bridge.isConnected()) {
      const text = bridge.listenError
        ? `Bridge not running: ${bridge.listenError.message}. Another session may own port ${bridge.port}.`
        : `Bridge listening on 127.0.0.1:${bridge.port}, but Roblox Studio is not connected. In Studio: Plugins tab → Studio Plus → Connect.`;
      return { isError: true, content: [{ type: "text", text }] };
    }

    const timeoutMs = tool.timeoutMs ? tool.timeoutMs(args) : DEFAULT_TIMEOUT_MS;
    try {
      let result = await bridge.send(name, args ?? {}, timeoutMs);
      if (name === "studio_status" && result && result.pluginVersion !== SERVER_INFO.version) {
        result = {
          ...result,
          serverVersion: SERVER_INFO.version,
          versionWarning: `Studio plugin is ${result.pluginVersion ?? "unknown"} but the MCP server is ${SERVER_INFO.version}. Copy the latest studio-plugin/RobloxStudioPlus.server.lua into Studio's Plugins folder and restart Studio.`,
        };
      }
      return { content: [{ type: "text", text: formatResult(result) }] };
    } catch (err) {
      return { isError: true, content: [{ type: "text", text: err.message }] };
    }
  }

  async function handle(msg) {
    if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
      if (msg && msg.id !== undefined) fail(msg.id, -32600, "Invalid Request");
      return;
    }
    const { id, method, params } = msg;
    const isNotification = id === undefined;
    switch (method) {
      case "initialize": {
        const requested = params?.protocolVersion;
        const protocolVersion = SUPPORTED_PROTOCOLS.includes(requested) ? requested : SUPPORTED_PROTOCOLS[0];
        return reply(id, { protocolVersion, capabilities: { tools: {} }, serverInfo: SERVER_INFO });
      }
      case "ping":
        return isNotification ? undefined : reply(id, {});
      case "tools/list":
        return reply(id, {
          tools: TOOLS.map(({ name, description, inputSchema, mutating }) => ({
            name,
            description,
            inputSchema,
            annotations: mutating ? { readOnlyHint: false, destructiveHint: true } : { readOnlyHint: true },
          })),
        });
      case "tools/call":
        return reply(id, await callTool(params?.name, params?.arguments));
      default:
        if (method.startsWith("notifications/") || isNotification) return;
        return fail(id, -32601, `Method not found: ${method}`);
    }
  }

  return { handle, callTool };
}
