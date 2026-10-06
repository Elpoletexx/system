---
description: Map the open Roblox Studio place (services, key folders, scripts, remotes) before changing anything
argument-hint: "[area to focus on, e.g. weapons, UI, ServerScriptService]"
---

Inspect the place open in Roblox Studio using the roblox-studio-plus tools. Do not modify anything.

Focus: $ARGUMENTS (if empty, give a whole-place overview).

1. `studio_status` — stop and explain how to connect if Studio is not connected; relay any `versionWarning`.
2. `get_tree` on `game` at depth 1, then depth 2-3 on Workspace, ReplicatedStorage, ServerScriptService, ServerStorage, StarterGui, StarterPlayer (or only the parts relevant to the focus).
3. `list_scripts`, and `find_instances` with className `RemoteEvent` and `RemoteFunction`.
4. For the focus area, `read_script` the main scripts and `search_scripts` for how they connect (require paths, remote names).

Report: the structure, where each system lives, the client/server boundary (which remotes exist and which server scripts handle them), duplicated names (`dup`/`[n]` paths), and anything that looks broken or risky. List open questions instead of guessing.
