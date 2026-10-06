// Runs Luau unit tests for pure plugin helpers when a `luau` binary is available
// (set LUAU_BIN or put luau on PATH; https://github.com/luau-lang/luau/releases).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LUAU = process.env.LUAU_BIN || "luau";
const available = spawnSync(LUAU, ["--help"]).error === undefined;

async function section(startMarker, endMarker) {
  const src = await readFile(new URL("../studio-plugin/RobloxStudioPlus.server.lua", import.meta.url), "utf8");
  const start = src.indexOf(startMarker);
  const end = src.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `markers not found: ${startMarker}`);
  return src.slice(start, end);
}

test("Luau path helpers", { skip: !available && "luau binary not found" }, async () => {
  const helpers = await section("local function findChild(", "local function resolveAll(");
  const harness = await readFile(new URL("./luau/paths.test.luau", import.meta.url), "utf8");
  const dir = await mkdtemp(join(tmpdir(), "rsp-luau-"));
  const file = join(dir, "paths.luau");
  await writeFile(file, harness.replace("--@@PATH_HELPERS@@", helpers));
  const run = spawnSync(LUAU, [file], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.match(run.stdout, /paths OK/);
});

test("Luau plugin compiles", { skip: !available && "luau binary not found" }, async () => {
  const compiler = LUAU.replace(/luau(\.exe)?$/, "luau-compile$1");
  const file = new URL("../studio-plugin/RobloxStudioPlus.server.lua", import.meta.url).pathname;
  const run = spawnSync(compiler, ["--null", file], { encoding: "utf8" });
  if (run.error) return; // compiler not shipped next to luau
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
