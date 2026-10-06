---
description: Plan and fly camera shots in Roblox Studio for a trailer or ad that follows Roblox's ad rules
argument-hint: "[length in seconds and style, e.g. 30s action]"
---

Help the user record a trailer/ad of the place open in Roblox Studio using the roblox-studio-plus camera tools. The user records with their own screen recorder; you move the camera.

Brief: $ARGUMENTS

Roblox video ads are rejected for: showing mechanics, UI or interactions that are not in the game; graphics enhanced beyond what players see; real-life footage; voice-over, narration or music with lyrics; promotional or subjective overlay text ("best game", "#1", free Robux). Plan only honest shots of real gameplay areas.

1. `studio_status`, then inspect the map (`get_tree` on Workspace, `find_instances` for landmarks, spawns, key models) and `get_properties` on Lighting. Do not change Lighting beyond matching what players really see.
2. Propose a shot list (shot, target, move type: `camera_set` still, `camera_orbit`, or `camera_path` keyframes, duration) that fits the requested length. Wait for the user's OK.
3. Preview each shot with `camera_set` / a short move and adjust.
4. For each final shot: ask the user to hide Studio UI (or go full screen) and be ready to record, then run it with `startDelay` of at least 3 seconds.
5. End with a checklist for editing: instrumental music only, factual gameplay text only, no fake UI.
