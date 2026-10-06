# Changelog

## 1.0.0
- `analyze_remotes`: client/server map of every remote, with warnings for server handlers without visible argument checks, client-fired remotes nobody handles, and unused remotes.
- `snapshot` / `diff_snapshot`: record a subtree and diff it later (added, removed, changed properties/attributes/sources).
- `undo` only undoes Claude's own steps unless `force` is passed.
- `find_instances`: `where` property filters and `properties` output.

## 0.6.0
- Read-only toolbar mode (all mutating tools refused, including inside `batch`) and MCP read-only/destructive annotations.
- Activity dock panel with a live log of Claude's commands.
- Per-command path cache for read-only tools; `edit_script` returns the edited lines.

## 0.5.0
- CFrame from `[x,y,z]` keeps rotation; Instance properties accept plain paths; `set_properties` returns before/after; NaN-safe camera.

## 0.4.0
- Bridge locks onto one Studio window; commands after Disconnect are refused; shorter long-poll; pattern search and output paging fixes.

## 0.3.0
- Bridge requires the Studio client header (blocks web pages); `insert_asset` audits before inserting; `audit_scripts`, `batch`, `terrain_fill`.

## 0.2.0
- Indexed paths for duplicate names; `create_tree`, `insert_asset`, `open_script`, `get_bounds`, `raycast`, `camera_orbit`; version check.

## 0.1.0
- First release: MCP server, Studio plugin bridge and skill.
