---
description: Scan the open Roblox Studio place for backdoors and obfuscated scripts
argument-hint: "[instance path to scan, default: whole place]"
---

Run a security audit of the place open in Roblox Studio with the roblox-studio-plus tools. Do not modify or delete anything.

Scope: $ARGUMENTS (if empty, scan `game`).

1. `studio_status`.
2. `audit_scripts` on the scope with minSeverity `medium`.
3. For every high finding and a sample of medium ones, `read_script` around the reported line to judge it. `require(<id>)` of a well-known official module or `PostAsync` to the developer's own backend can be legitimate; say so when that is the likely reading.
4. Look for hidden script containers too: `find_instances` for scripts whose names imitate system objects (e.g. names like "Script", "Fire", "Weld", "ThumbnailCamera") inside models in Workspace.

Report a table: path, line, rule, verdict (malicious / suspicious / likely fine) and why. Recommend actions (remove, review with the author, keep) but wait for the user's OK before deleting or editing anything.
