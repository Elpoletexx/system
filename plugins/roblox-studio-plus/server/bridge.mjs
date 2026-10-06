// Localhost HTTP bridge between the MCP server and the Roblox Studio plugin.
// Studio cannot accept inbound connections, so the plugin long-polls GET /poll
// for the next command and posts the outcome to POST /result.

import http from "node:http";
import { randomUUID } from "node:crypto";

const POLL_WAIT_MS = 20_000;
const CONNECTED_WINDOW_MS = 30_000;
const MAX_BODY_BYTES = 16 * 1024 * 1024;

export class StudioBridge {
  constructor({ port, host = "127.0.0.1", log = () => {} }) {
    this.port = port;
    this.host = host;
    this.log = log;
    this.queue = []; // commands not yet handed to Studio
    this.pending = new Map(); // id -> { resolve, reject, timer, command }
    this.waiters = []; // long-poll responses waiting for a command
    this.lastPollAt = 0;
    this.listenError = null;
    this.server = http.createServer((req, res) => this.#handle(req, res));
  }

  listen() {
    return new Promise((resolve) => {
      this.server.once("error", (err) => {
        this.listenError = err;
        this.log(`bridge failed to listen on ${this.host}:${this.port}: ${err.message}`);
        resolve(false);
      });
      this.server.listen(this.port, this.host, () => {
        this.port = this.server.address().port;
        this.log(`bridge listening on http://${this.host}:${this.port}`);
        resolve(true);
      });
    });
  }

  close() {
    for (const w of this.waiters) w.end();
    this.waiters = [];
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(new Error("Bridge closed"));
      this.pending.delete(id);
    }
    return new Promise((resolve) => this.server.close(() => resolve()));
  }

  isConnected() {
    return this.waiters.length > 0 || Date.now() - this.lastPollAt < CONNECTED_WINDOW_MS;
  }

  send(tool, args, timeoutMs) {
    if (this.listenError) {
      return Promise.reject(
        new Error(
          `Bridge is not running (${this.listenError.code || this.listenError.message}). ` +
            `Another Claude session may already own port ${this.port}; close it or set ROBLOX_STUDIO_PLUS_PORT on both sides.`
        )
      );
    }
    if (!this.isConnected()) {
      return Promise.reject(
        new Error(
          "Roblox Studio is not connected. Open Studio, install the Studio Plus plugin, and click its 'Connect' toolbar button."
        )
      );
    }
    const command = { id: randomUUID(), tool, args: args ?? {} };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(command.id);
        this.queue = this.queue.filter((c) => c.id !== command.id);
        reject(new Error(`Studio did not answer '${tool}' within ${Math.round(timeoutMs / 1000)}s.`));
      }, timeoutMs);
      this.pending.set(command.id, { resolve, reject, timer, command });
      this.queue.push(command);
      this.#flush();
    });
  }

  #flush() {
    while (this.queue.length > 0 && this.waiters.length > 0) {
      const res = this.waiters.shift();
      if (res.writableEnded || res.destroyed) continue;
      const command = this.queue.shift();
      this.#json(res, 200, command);
    }
  }

  #json(res, status, body) {
    const data = body === undefined ? "" : JSON.stringify(body);
    res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(data);
  }

  #allowed(req) {
    // Browsers always send Origin on cross-site requests; Studio does not.
    // Also pin Host to loopback to block DNS-rebinding.
    if (req.headers.origin) return false;
    const host = String(req.headers.host || "").replace(/:\d+$/, "");
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  }

  #handle(req, res) {
    if (!this.#allowed(req)) return this.#json(res, 403, { error: "forbidden" });
    const url = new URL(req.url, "http://localhost");

    if (req.method === "GET" && url.pathname === "/health") {
      return this.#json(res, 200, { ok: true, name: "roblox-studio-plus" });
    }

    if (req.method === "GET" && url.pathname === "/poll") {
      this.lastPollAt = Date.now();
      if (this.queue.length > 0) return this.#json(res, 200, this.queue.shift());
      const timer = setTimeout(() => {
        this.waiters = this.waiters.filter((w) => w !== res);
        this.lastPollAt = Date.now();
        if (!res.writableEnded) {
          res.writeHead(204);
          res.end();
        }
      }, POLL_WAIT_MS);
      res.on("close", () => {
        clearTimeout(timer);
        this.waiters = this.waiters.filter((w) => w !== res);
      });
      res.on("finish", () => clearTimeout(timer));
      this.waiters.push(res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/result") {
      let size = 0;
      const chunks = [];
      req.on("data", (c) => {
        size += c.length;
        if (size > MAX_BODY_BYTES) {
          this.#json(res, 413, { error: "too large" });
          req.destroy();
          return;
        }
        chunks.push(c);
      });
      req.on("end", () => {
        if (res.writableEnded) return;
        let msg;
        try {
          msg = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          return this.#json(res, 400, { error: "invalid json" });
        }
        const p = msg && typeof msg.id === "string" ? this.pending.get(msg.id) : undefined;
        if (!p) return this.#json(res, 404, { error: "unknown or expired command id" });
        this.pending.delete(msg.id);
        clearTimeout(p.timer);
        if (msg.ok === true) p.resolve(msg.result);
        else p.reject(new Error(typeof msg.error === "string" ? msg.error : "Studio reported an unknown error"));
        this.#json(res, 200, { ok: true });
      });
      return;
    }

    this.#json(res, 404, { error: "not found" });
  }
}
