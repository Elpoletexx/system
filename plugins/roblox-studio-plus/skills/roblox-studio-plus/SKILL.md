---
name: roblox-studio-plus
description: Use when working inside a live Roblox Studio place - inspecting the Explorer tree, reading or editing scripts, changing properties/attributes/tags, bulk edits, undo, reading Output, or framing and flying the camera to record a trailer or clip. Covers the roblox-studio-plus MCP tools and how they combine with the official Roblox Studio MCP (run_code, insert_model, play mode).
---

# Roblox Studio Plus

The `roblox-studio-plus` MCP server talks to Roblox Studio through a companion plugin. It adds structured, undoable tools that the official Roblox Studio MCP does not have. Use both: the official MCP for playtesting (`start_stop_play`, `run_script_in_play_mode`, `get_studio_mode`) and Creator Store inserts (`insert_model`); this one for everything below.

## First call

Call `studio_status`. If `readOnly` is true, the user has locked edits: inspect and plan freely, and when you are ready to change things ask them to turn off **Read-only** in the Plugins tab (never try to work around it with other tools). If it returns `versionWarning`, tell the user to copy the new Studio plugin file and restart Studio. If it says Studio is not connected, tell the user to open Studio → **Plugins** tab → **Studio Plus** → **Connect** (and to allow the localhost HTTP permission prompt). Do not fall back to guessing.

## Workflow: inspect → plan → change → verify

1. **Inspect before touching anything.** `get_tree` (start at depth 1-2, drill down), `find_instances`, `list_scripts`, `search_scripts`, `read_script`, `get_properties`. Never assume a folder, RemoteEvent, module or property exists — confirm it.
2. **Plan** what you will change and what you will not, and the risks (server/client boundary, other scripts that require the module, replication).
3. **Change with the smallest tool that fits**:
   - script text → `edit_script` (exact snippet replace; quote `oldText` from `read_script` output without the line-number prefix). It returns the edited lines with numbers — read them to confirm the change landed as intended. Use `write_script` only for new or fully rewritten scripts.
   - properties → `set_properties`; attributes → `set_attributes`; tags → `manage_tags`
   - structure → `create_instance`, `clone_instance`, `reparent_instances`, `delete_instances`
   - a whole hierarchy (ScreenGui with frames/buttons, a model, a folder of RemoteEvents) → `create_tree` in one call instead of many `create_instance`
   - existing assets by ID → `insert_asset` (reuse what the project already owns before building new). It audits the asset's scripts first and refuses high-severity backdoor patterns; show the user the `findings` and `scripts` it returns, and only retry with `allowSuspicious` if they explicitly accept the risk.
   - several related changes → `batch` so they land as one undo step and roll back together
   - terrain → `terrain_fill` (block/ball/cylinder; material `Air` carves)
   - placement → `get_bounds` for sizes/top/bottom, `raycast` to find the ground
   - anything else → `run_luau` (still one undo step)
   - show the user the code you are talking about → `open_script` at the line
4. **Verify**: re-read what you changed, `search_scripts` for other references to renamed things, `get_output` for errors, and use the official MCP's play-mode tools for a runtime check.

The user can watch every call in the Studio Plus **Activity** panel, so keep calls purposeful. Every mutating tool is a single Studio undo step and is rolled back if any part fails. `undo`/`redo` step through Studio's history (including the user's own steps — only undo what you just did).

## Paths

- Dotted from a service: `Workspace.Map.SpawnLocation`, `ServerScriptService.Main`. Leading `game.` is optional.
- If a name contains a dot use `/`: `ReplicatedStorage/Modules/Config.v2`.
- Siblings that share a name get an index: `Workspace.Map.Tree[2]` (1-based, Explorer order). Every path a tool returns already includes it, so copy paths from tool output instead of typing them. A bare `Tree` means the first one. `get_tree` also marks these with `dup: true`.
- Indexes shift when siblings are added, removed or reordered — re-read paths after structural changes.

## Values

Plain JSON is coerced to the property's current type:

| Type | Plain form | Tagged form |
| --- | --- | --- |
| Vector3 | `[x, y, z]` | `{"$type":"Vector3","value":[x,y,z]}` |
| CFrame | `[x,y,z]` (moves, keeps current rotation) or 12 components | `{"$type":"CFrame","position":[..],"lookAt":[..]}` |
| Color3 | `"#ff8800"`, `[1,0.5,0]`, or `[255,128,0]` | `{"$type":"Color3","value":[r,g,b]}` |
| Enum | `"Neon"` | `{"$type":"EnumItem","enum":"Material","value":"Neon"}` |
| UDim2 | `[xs, xo, ys, yo]` | `{"$type":"UDim2","value":[..]}` |
| BrickColor | `"Bright red"` | `{"$type":"BrickColor","value":"Bright red"}` |
| Instance ref | `"Workspace.Part"` when the property already holds an Instance | `{"$type":"Instance","path":"Workspace.Part"}` (always works, needed when the property is empty) |

`set_properties` returns `before` and `after` for each instance (first 25). Check `after`: Roblox can clamp or round values (e.g. Transparency, sizes below the minimum).

For attributes (which have no current type when new) use the tagged form for anything that is not a string, number or boolean. `Parent` cannot be set with `set_properties`; use `reparent_instances`.

## Recording trailers / clips

`camera_set` (position + lookAt, or `target` to frame an instance), `camera_orbit` (turntable around a model) and `camera_path` (Catmull-Rom spline through keyframes, smooth easing, `startDelay` countdown printed in Output) fly the Studio camera so the user's screen recorder captures smooth shots. Workflow:

1. Inspect the map (`get_tree`, `find_instances` for landmarks) and pick shots that show **real gameplay areas**.
2. Preview each shot with `camera_set`; tweak `Lighting` with `set_properties` only to match the real in-game look.
3. Ask the user to hide Studio UI / go full-screen and start recording, then run `camera_path` with a `startDelay`.

Roblox video ads are rejected for: footage of mechanics/UI not in the game, graphics enhanced beyond what players see, real-life footage, voice-over or music with lyrics, and promotional or subjective overlay text ("best game", "#1", free Robux). Keep shots honest to actual gameplay and leave text to factual gameplay context.

## Safety

- After any free model enters the place (yours, the official MCP's `insert_model`, or the user's), run `audit_scripts` on it. Report findings as leads to review, not proof — legitimate code can use `require(id)` for official modules.
- `delete_instances` refuses services, Terrain and the current camera. Still inspect first and list what you will delete.
- `run_luau` runs with plugin permissions in the edit place. Do not use it to bypass the dedicated tools, make HTTP calls, or touch anything the user did not ask for.
- Validate gameplay logic server-side in the scripts you write; never trust client input for damage, ammo, cooldowns, team or permissions.
