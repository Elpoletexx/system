--[[
	Roblox Studio Plus — Studio side of the Claude bridge.

	Long-polls the local MCP server (server/index.mjs) for commands, runs them in
	the edit DataModel and posts the result back. Nothing runs until the user
	presses "Connect" in the Plugins tab; the choice is remembered per machine.

	Install: copy this file into Studio's local Plugins folder
	(Plugins tab → Plugins Folder) and restart Studio.
]]

local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")
local Selection = game:GetService("Selection")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local ScriptEditorService = game:GetService("ScriptEditorService")
local CollectionService = game:GetService("CollectionService")
local LogService = game:GetService("LogService")

-- Plugins are also loaded into Play Solo client/server DataModels; only the edit one talks to Claude.
if not RunService:IsEdit() then
	return
end

local VERSION = "0.6.0"
local PORT = 44877 -- must match ROBLOX_STUDIO_PLUS_PORT on the MCP server (default 44877)
local BASE_URL = "http://localhost:" .. PORT
local SETTING_ENABLED = "RobloxStudioPlus_Enabled"
-- Identifies this Studio window so the server never splits commands between two open places.
local SESSION_ID = HttpService:GenerateGUID(false)
local OUTPUT_BUFFER_SIZE = 500

---------------------------------------------------------------------------
-- Output capture
---------------------------------------------------------------------------

local outputLog = {}
local outputSeq = 0

local MESSAGE_TYPES = {
	[Enum.MessageType.MessageOutput] = "output",
	[Enum.MessageType.MessageInfo] = "info",
	[Enum.MessageType.MessageWarning] = "warning",
	[Enum.MessageType.MessageError] = "error",
}

local function pushOutput(message, messageType)
	outputSeq += 1
	table.insert(outputLog, { seq = outputSeq, type = MESSAGE_TYPES[messageType] or "output", message = message })
	if #outputLog > OUTPUT_BUFFER_SIZE then
		table.remove(outputLog, 1)
	end
end

for _, entry in LogService:GetLogHistory() do
	pushOutput(entry.message, entry.messageType)
end
local outputConnection = LogService.MessageOut:Connect(pushOutput)

---------------------------------------------------------------------------
-- Argument helpers (never trust incoming data)
---------------------------------------------------------------------------

local function argString(args, key, optional)
	local v = args[key]
	if v == nil and optional then
		return nil
	end
	if type(v) ~= "string" then
		error(("argument '%s' must be a string"):format(key), 0)
	end
	return v
end

local function argNumber(args, key, default, min, max)
	local v = args[key]
	if v == nil then
		return default
	end
	if type(v) ~= "number" or v ~= v then
		error(("argument '%s' must be a number"):format(key), 0)
	end
	if min then
		v = math.max(v, min)
	end
	if max then
		v = math.min(v, max)
	end
	return v
end

local function argRequiredNumber(args, key, min, max)
	local v = argNumber(args, key, nil, min, max)
	if v == nil then
		error(("argument '%s' is required"):format(key), 0)
	end
	return v
end

local function argStringList(args, key, optional)
	local v = args[key]
	if v == nil and optional then
		return {}
	end
	if type(v) ~= "table" then
		error(("argument '%s' must be a list of strings"):format(key), 0)
	end
	for i, s in v do
		if type(i) ~= "number" or type(s) ~= "string" then
			error(("argument '%s' must be a list of strings"):format(key), 0)
		end
	end
	return v
end

local function argMap(args, key, optional)
	local v = args[key]
	if v == nil and optional then
		return {}
	end
	if type(v) ~= "table" then
		error(("argument '%s' must be an object"):format(key), 0)
	end
	return v
end

---------------------------------------------------------------------------
-- Paths
---------------------------------------------------------------------------

-- Duplicate sibling names are addressed as "Name[2]" (1-based, in GetChildren order).
local function findChild(node, name)
	local child = node:FindFirstChild(name)
	if child == nil and node == game then
		local ok, service = pcall(game.FindService, game, name)
		child = ok and service or nil
	end
	if child ~= nil then
		return child
	end
	local base, index = string.match(name, "^(.*)%[(%d+)%]$")
	if base == nil then
		return nil
	end
	local wanted, seen = tonumber(index), 0
	for _, c in node:GetChildren() do
		if c.Name == base then
			seen += 1
			if seen == wanted then
				return c
			end
		end
	end
	return nil
end

local function resolve(path)
	if path == nil or path == "" or path == "game" then
		return game
	end
	local sep = string.find(path, "/", 1, true) and "/" or "."
	local parts = string.split(path, sep)
	local node = game
	local first = (parts[1] == "game") and 2 or 1
	for i = first, #parts do
		local name = parts[i]
		if name ~= "" then
			local child = findChild(node, name)
			if child == nil then
				error(("path not found: '%s' (no child '%s' under %s)"):format(path, name, node:GetFullName()), 0)
			end
			node = child
		end
	end
	return node
end

-- Per-command cache: parent -> { [child] = segment }. Without it, listing thousands of
-- same-folder results rescans the folder once per result.
local segmentCache = nil

local function segmentsFor(parent)
	local names, counts = {}, {}
	local children = parent:GetChildren()
	for _, c in children do
		counts[c.Name] = (counts[c.Name] or 0) + 1
	end
	local seen = {}
	for _, c in children do
		if counts[c.Name] > 1 then
			seen[c.Name] = (seen[c.Name] or 0) + 1
			names[c] = ("%s[%d]"):format(c.Name, seen[c.Name])
		else
			names[c] = c.Name
		end
	end
	return names
end

-- Name of `inst` as a path segment, with an index suffix when siblings share its name.
local function segmentOf(inst)
	local parent = inst.Parent
	if parent == nil then
		return inst.Name
	end
	if segmentCache then
		local names = segmentCache[parent]
		if names == nil then
			names = segmentsFor(parent)
			segmentCache[parent] = names
		end
		return names[inst] or inst.Name
	end
	return segmentsFor(parent)[inst] or inst.Name
end

local function withPathCache(fn, ...)
	local previous = segmentCache
	segmentCache = setmetatable({}, { __mode = "k" })
	local results = table.pack(pcall(fn, ...))
	segmentCache = previous
	if not results[1] then
		error(results[2], 0)
	end
	return table.unpack(results, 2, results.n)
end

local function pathOf(inst)
	if inst == game then
		return "game"
	end
	local names = {}
	local useSlash = false
	local node = inst
	while node ~= nil and node ~= game do
		table.insert(names, 1, segmentOf(node))
		if string.find(node.Name, ".", 1, true) then
			useSlash = true
		end
		node = node.Parent
	end
	local joined = table.concat(names, useSlash and "/" or ".")
	if node == nil then
		return "<not in DataModel>" .. (useSlash and "/" or ".") .. joined
	end
	return joined
end

local function resolveAll(list)
	local out = {}
	for _, p in list do
		table.insert(out, resolve(p))
	end
	return out
end

---------------------------------------------------------------------------
-- Value encoding (Roblox -> JSON) and decoding (JSON -> Roblox)
---------------------------------------------------------------------------

local encode

local function encodeTable(t, depth)
	if depth > 6 then
		return "<max depth>"
	end
	local n = #t
	local count = 0
	for _ in t do
		count += 1
	end
	if n > 0 and n == count then
		local list = table.create(n)
		for i = 1, n do
			list[i] = encode(t[i], depth + 1)
		end
		return list
	end
	local map = {}
	for k, v in t do
		map[tostring(k)] = encode(v, depth + 1)
	end
	return map
end

function encode(v, depth)
	depth = depth or 0
	local t = typeof(v)
	if t == "nil" or t == "boolean" or t == "string" then
		return v
	elseif t == "number" then
		if v ~= v or v == math.huge or v == -math.huge then
			return { ["$type"] = "number", value = tostring(v) }
		end
		return v
	elseif t == "Vector3" then
		return { ["$type"] = "Vector3", value = { v.X, v.Y, v.Z } }
	elseif t == "Vector2" then
		return { ["$type"] = "Vector2", value = { v.X, v.Y } }
	elseif t == "CFrame" then
		local rx, ry, rz = v:ToOrientation()
		return {
			["$type"] = "CFrame",
			value = { v:GetComponents() },
			position = { v.X, v.Y, v.Z },
			orientationDeg = { math.deg(rx), math.deg(ry), math.deg(rz) },
		}
	elseif t == "Color3" then
		return { ["$type"] = "Color3", value = { v.R, v.G, v.B }, hex = "#" .. v:ToHex() }
	elseif t == "BrickColor" then
		return { ["$type"] = "BrickColor", value = v.Name }
	elseif t == "UDim" then
		return { ["$type"] = "UDim", value = { v.Scale, v.Offset } }
	elseif t == "UDim2" then
		return { ["$type"] = "UDim2", value = { v.X.Scale, v.X.Offset, v.Y.Scale, v.Y.Offset } }
	elseif t == "EnumItem" then
		return { ["$type"] = "EnumItem", enum = tostring(v.EnumType), value = v.Name }
	elseif t == "Instance" then
		return { ["$type"] = "Instance", path = pathOf(v), className = v.ClassName }
	elseif t == "NumberRange" then
		return { ["$type"] = "NumberRange", value = { v.Min, v.Max } }
	elseif t == "NumberSequence" then
		local kps = {}
		for _, kp in v.Keypoints do
			table.insert(kps, { kp.Time, kp.Value, kp.Envelope })
		end
		return { ["$type"] = "NumberSequence", value = kps }
	elseif t == "ColorSequence" then
		local kps = {}
		for _, kp in v.Keypoints do
			table.insert(kps, { kp.Time, kp.Value.R, kp.Value.G, kp.Value.B })
		end
		return { ["$type"] = "ColorSequence", value = kps }
	elseif t == "Font" then
		return { ["$type"] = "Font", family = v.Family, weight = v.Weight.Name, style = v.Style.Name }
	elseif t == "table" then
		return encodeTable(v, depth)
	end
	return { ["$type"] = t, value = tostring(v) }
end

local function numbers(list, count, label)
	if type(list) ~= "table" or #list ~= count then
		error(("%s expects a list of %d numbers"):format(label, count), 0)
	end
	for i = 1, count do
		if type(list[i]) ~= "number" then
			error(("%s expects a list of %d numbers"):format(label, count), 0)
		end
	end
	return table.unpack(list, 1, count)
end

local function color3From(value)
	if type(value) == "string" then
		return Color3.fromHex(value)
	end
	local r, g, b = numbers(value, 3, "Color3")
	if r > 1 or g > 1 or b > 1 then
		return Color3.fromRGB(r, g, b)
	end
	return Color3.new(r, g, b)
end

local function cframeFrom(value)
	if type(value) == "table" and #value == 3 then
		return CFrame.new(numbers(value, 3, "CFrame"))
	end
	return CFrame.new(numbers(value, 12, "CFrame"))
end

local function enumItemFrom(enumName, itemName)
	local okEnum, enumType = pcall(function()
		return (Enum :: any)[enumName]
	end)
	if not okEnum or enumType == nil then
		error(("unknown enum '%s'"):format(tostring(enumName)), 0)
	end
	local okItem, item = pcall(function()
		return enumType[itemName]
	end)
	if not okItem or item == nil then
		error(("'%s' is not a member of Enum.%s"):format(tostring(itemName), tostring(enumName)), 0)
	end
	return item
end

local TAGGED = {
	Vector3 = function(t)
		return Vector3.new(numbers(t.value, 3, "Vector3"))
	end,
	Vector2 = function(t)
		return Vector2.new(numbers(t.value, 2, "Vector2"))
	end,
	CFrame = function(t)
		if t.position and t.lookAt then
			return CFrame.lookAt(Vector3.new(numbers(t.position, 3, "position")), Vector3.new(numbers(t.lookAt, 3, "lookAt")))
		end
		return cframeFrom(t.value)
	end,
	Color3 = function(t)
		return color3From(t.hex or t.value)
	end,
	BrickColor = function(t)
		return BrickColor.new(t.value)
	end,
	UDim = function(t)
		return UDim.new(numbers(t.value, 2, "UDim"))
	end,
	UDim2 = function(t)
		return UDim2.new(numbers(t.value, 4, "UDim2"))
	end,
	EnumItem = function(t)
		return enumItemFrom(t.enum, t.value)
	end,
	Instance = function(t)
		return resolve(t.path)
	end,
	NumberRange = function(t)
		return NumberRange.new(numbers(t.value, 2, "NumberRange"))
	end,
	NumberSequence = function(t)
		local kps = {}
		for _, kp in t.value do
			table.insert(kps, NumberSequenceKeypoint.new(kp[1], kp[2], kp[3] or 0))
		end
		return NumberSequence.new(kps)
	end,
	ColorSequence = function(t)
		local kps = {}
		for _, kp in t.value do
			table.insert(kps, ColorSequenceKeypoint.new(kp[1], Color3.new(kp[2], kp[3], kp[4])))
		end
		return ColorSequence.new(kps)
	end,
	Font = function(t)
		return Font.new(
			t.family,
			t.weight and enumItemFrom("FontWeight", t.weight) or Enum.FontWeight.Regular,
			t.style and enumItemFrom("FontStyle", t.style) or Enum.FontStyle.Normal
		)
	end,
}

-- Decode a JSON value, using the property's current value to infer the type of plain JSON.
local function decode(value, current)
	if type(value) == "table" and value["$type"] ~= nil then
		local ctor = TAGGED[value["$type"]]
		if ctor == nil then
			error(("unsupported $type '%s'"):format(tostring(value["$type"])), 0)
		end
		return ctor(value)
	end
	local ct = typeof(current)
	if ct == "EnumItem" and type(value) == "string" then
		return enumItemFrom(tostring(current.EnumType), value)
	elseif ct == "Vector3" and type(value) == "table" then
		return Vector3.new(numbers(value, 3, "Vector3"))
	elseif ct == "Vector2" and type(value) == "table" then
		return Vector2.new(numbers(value, 2, "Vector2"))
	elseif ct == "Color3" and (type(value) == "table" or type(value) == "string") then
		return color3From(value)
	elseif ct == "BrickColor" and type(value) == "string" then
		return BrickColor.new(value)
	elseif ct == "CFrame" and type(value) == "table" then
		if #value == 3 then
			-- Position only: keep the current rotation instead of resetting it.
			return CFrame.new(numbers(value, 3, "CFrame")) * current.Rotation
		end
		return cframeFrom(value)
	elseif ct == "UDim2" and type(value) == "table" then
		return UDim2.new(numbers(value, 4, "UDim2"))
	elseif ct == "UDim" and type(value) == "table" then
		return UDim.new(numbers(value, 2, "UDim"))
	elseif ct == "NumberRange" and type(value) == "table" then
		return NumberRange.new(numbers(value, 2, "NumberRange"))
	elseif ct == "Instance" and type(value) == "string" then
		return resolve(value)
	end
	return value
end

---------------------------------------------------------------------------
-- Undo integration
---------------------------------------------------------------------------

local recordingDepth = 0

-- One undo step per tool call. Nested calls (batch, run_luau calling tools) join the outer step.
local function withUndo(name, fn)
	if recordingDepth > 0 then
		return fn()
	end
	local recording = ChangeHistoryService:TryBeginRecording("Claude: " .. name)
	recordingDepth += 1
	local ok, result = pcall(fn)
	recordingDepth -= 1
	if recording then
		ChangeHistoryService:FinishRecording(
			recording,
			ok and Enum.FinishRecordingOperation.Commit or Enum.FinishRecordingOperation.Cancel
		)
	end
	if not ok then
		error(result, 0)
	end
	return result
end

---------------------------------------------------------------------------
-- Instance helpers
---------------------------------------------------------------------------

local COMMON_PROPERTIES = {
	"Name", "ClassName", "Archivable",
	-- parts & models
	"Anchored", "CanCollide", "CanTouch", "CanQuery", "Locked", "Massless", "CastShadow",
	"Transparency", "Reflectance", "Color", "Material", "Shape", "Size", "Position", "Orientation",
	"CFrame", "PrimaryPart", "WorldPivot", "MeshId", "TextureID", "Texture",
	-- scripts
	"Enabled", "Disabled", "RunContext", "LinkedSource",
	-- gui
	"Visible", "Text", "TextColor3", "TextSize", "TextScaled", "FontFace", "BackgroundColor3",
	"BackgroundTransparency", "Image", "ImageColor3", "AnchorPoint", "ZIndex", "LayoutOrder",
	"ResetOnSpawn", "DisplayOrder",
	-- sound / animation
	"SoundId", "Volume", "Looped", "PlaybackSpeed", "AnimationId",
	-- values, lights, effects
	"Value", "Brightness", "Range", "Angle", "Shadows",
	-- lighting / camera / atmosphere
	"Ambient", "OutdoorAmbient", "ClockTime", "GeographicLatitude", "ExposureCompensation",
	"FogStart", "FogEnd", "FogColor", "Technology", "Density", "Offset", "Haze", "Glare",
	"FieldOfView", "CameraType", "CameraSubject",
	-- humanoids, teams, constraints
	"Health", "MaxHealth", "WalkSpeed", "JumpPower", "JumpHeight", "DisplayName",
	"TeamColor", "AutoAssignable", "Adornee", "Part0", "Part1", "C0", "C1", "Attachment0", "Attachment1",
}

local function readProperty(inst, name)
	local ok, value = pcall(function()
		return (inst :: any)[name]
	end)
	if ok and typeof(value) ~= "RBXScriptSignal" and typeof(value) ~= "function" then
		return true, value
	end
	return false, nil
end

local function applyProperties(inst, props)
	for name, raw in props do
		if type(name) ~= "string" then
			error("property names must be strings", 0)
		end
		if name == "Parent" then
			error("set 'Parent' with reparent_instances, not set_properties", 0)
		end
		local _, current = readProperty(inst, name)
		local value = decode(raw, current)
		local ok, err = pcall(function()
			(inst :: any)[name] = value
		end)
		if not ok then
			local hint = ""
			if type(raw) == "string" and current == nil then
				hint = ' (if this property holds an Instance, pass {"$type":"Instance","path":"..."})'
			end
			error(("%s.%s: %s%s"):format(pathOf(inst), name, tostring(err), hint), 0)
		end
	end
end

local function isProtected(inst)
	if inst == game or inst.Parent == game then
		return true -- the DataModel and services
	end
	if inst == workspace.Terrain or inst == workspace.CurrentCamera then
		return true
	end
	return false
end

local function getSource(scriptInst)
	if not scriptInst:IsA("LuaSourceContainer") then
		error(pathOf(scriptInst) .. " is not a script", 0)
	end
	return ScriptEditorService:GetEditorSource(scriptInst)
end

local function setSource(scriptInst, newSource)
	ScriptEditorService:UpdateSourceAsync(scriptInst, function()
		return newSource
	end)
end

local function countLines(s)
	local _, n = string.gsub(s, "\n", "")
	return n + 1
end

local function forEachScript(root, fn)
	local function visit(container)
		local ok, descendants = pcall(container.GetDescendants, container)
		if not ok then
			return
		end
		for _, d in descendants do
			if d:IsA("LuaSourceContainer") then
				fn(d)
			end
		end
	end
	if root == game then
		for _, service in game:GetChildren() do
			if service:IsA("LuaSourceContainer") then
				fn(service)
			end
			visit(service)
		end
	else
		visit(root)
	end
end

local function boundingBox(inst)
	if inst:IsA("BasePart") then
		return inst.CFrame, inst.Size
	elseif inst:IsA("Model") then
		local ok, cf, size = pcall(inst.GetBoundingBox, inst)
		if not ok or size.Magnitude == 0 then
			error(pathOf(inst) .. " has no parts to measure", 0)
		end
		return cf, size
	elseif inst:IsA("Attachment") then
		return inst.WorldCFrame, Vector3.new(4, 4, 4)
	end
	error(pathOf(inst) .. " has no world position (expected BasePart, Model or Attachment)", 0)
end

local function targetPoint(path)
	local cf = boundingBox(resolve(path))
	return cf.Position
end

---------------------------------------------------------------------------
-- Camera paths
---------------------------------------------------------------------------

-- CFrame.lookAt with identical points yields NaN; fall back to a fixed orientation.
local function safeLookAt(position, target, fallback)
	if (target - position).Magnitude < 1e-3 then
		return CFrame.new(position) * (fallback and fallback.Rotation or CFrame.new())
	end
	return CFrame.lookAt(position, target)
end

local function catmullRom(p0, p1, p2, p3, t)
	local t2, t3 = t * t, t * t * t
	return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
end

local function smoothstep(t)
	return t * t * (3 - 2 * t)
end

local function buildKeyframes(list, duration)
	if type(list) ~= "table" or #list < 2 then
		error("camera_path needs at least 2 keyframes", 0)
	end
	local frames = {}
	local explicitTimes = true
	for i, kf in list do
		if type(kf) ~= "table" then
			error(("keyframe %d must be an object"):format(i), 0)
		end
		local pos = Vector3.new(numbers(kf.position, 3, ("keyframe %d position"):format(i)))
		local look
		if type(kf.target) == "string" then
			look = targetPoint(kf.target)
		elseif kf.lookAt ~= nil then
			look = Vector3.new(numbers(kf.lookAt, 3, ("keyframe %d lookAt"):format(i)))
		end
		if type(kf.time) ~= "number" then
			explicitTimes = false
		end
		table.insert(frames, { pos = pos, look = look, fov = type(kf.fov) == "number" and kf.fov or nil, time = kf.time })
	end
	for i, f in frames do
		if not explicitTimes then
			f.time = duration * (i - 1) / (#frames - 1)
		end
		if i > 1 and f.time <= frames[i - 1].time then
			error("keyframe times must be strictly increasing", 0)
		end
		-- Default look direction: towards the next keyframe (or keep the previous one).
		if f.look == nil then
			local nextFrame = frames[i + 1]
			f.look = nextFrame and nextFrame.pos or (frames[i - 1] and frames[i - 1].look) or (f.pos + Vector3.new(0, 0, -1))
		end
	end
	return frames
end

local function samplePath(frames, t)
	local n = #frames
	if t <= frames[1].time then
		return frames[1].pos, frames[1].look, frames[1].fov
	end
	if t >= frames[n].time then
		return frames[n].pos, frames[n].look, frames[n].fov
	end
	local i = 1
	while frames[i + 1].time < t do
		i += 1
	end
	local a, b = frames[i], frames[i + 1]
	local u = (t - a.time) / (b.time - a.time)
	local p0 = (frames[i - 1] or a).pos
	local p3 = (frames[i + 2] or b).pos
	local pos = catmullRom(p0, a.pos, b.pos, p3, u)
	local look = a.look:Lerp(b.look, u)
	local fov = nil
	if a.fov or b.fov then
		local fa, fb = a.fov or b.fov, b.fov or a.fov
		fov = fa + (fb - fa) * u
	end
	return pos, look, fov
end

---------------------------------------------------------------------------
-- Script audit (common free-model backdoor / obfuscation signatures)
---------------------------------------------------------------------------

local AUDIT_RULES = {
	{ id = "remote-require", severity = "high", pattern = "require%s*%(%s*%d%d%d%d+", why = "require() by asset ID loads code from outside the place (classic backdoor)" },
	{ id = "remote-require-tonumber", severity = "high", pattern = "require%s*%(%s*tonumber", why = "require() of a computed asset ID (hidden backdoor)" },
	{ id = "loadstring", severity = "high", pattern = "loadstring%s*%(", why = "runs code built from a string" },
	{ id = "discord-webhook", severity = "high", pattern = "discord[app]*%.com/api/webhooks", why = "sends data to a Discord webhook" },
	{ id = "getfenv", severity = "medium", pattern = "getfenv%s*%(", why = "environment tampering, often used to hide require/loadstring" },
	{ id = "setfenv", severity = "medium", pattern = "setfenv%s*%(", why = "environment tampering" },
	{ id = "http-out", severity = "medium", pattern = ":%s*PostAsync%s*%(", why = "sends data to an external server" },
	{ id = "runtime-insert", severity = "medium", pattern = "LoadAsset%s*%(", why = "loads assets at runtime" },
	{ id = "escaped-bytes", severity = "medium", pattern = "\\%d+\\%d+\\%d+\\%d+", why = "byte-escaped strings (obfuscation)" },
	{ id = "string-reverse", severity = "low", pattern = "string%.reverse%s*%(", why = "reversed strings (sometimes obfuscation)" },
	{ id = "char-build", severity = "low", pattern = "string%.char%s*%(%s*%d+%s*,%s*%d+%s*,%s*%d+", why = "strings built from char codes (sometimes obfuscation)" },
}
local LONG_LINE = 2000

local function auditSource(source)
	local findings = {}
	for lineNo, line in string.split(source, "\n") do
		for _, rule in AUDIT_RULES do
			if string.find(line, rule.pattern) then
				table.insert(findings, { line = lineNo, rule = rule.id, severity = rule.severity, why = rule.why, text = string.sub(line, 1, 200) })
			end
		end
		if #line > LONG_LINE then
			table.insert(findings, { line = lineNo, rule = "long-line", severity = "medium", why = ("line is %d characters (possible packed payload)"):format(#line), text = string.sub(line, 1, 120) })
		end
	end
	return findings
end

local function auditTree(root)
	local results, high = {}, 0
	local function check(s)
		local ok, source = pcall(function()
			return s.Source
		end)
		if not ok then
			return
		end
		for _, finding in auditSource(source) do
			finding.path = pathOf(s)
			if finding.severity == "high" then
				high += 1
			end
			table.insert(results, finding)
		end
	end
	if root:IsA("LuaSourceContainer") then
		check(root)
	end
	for _, d in root:GetDescendants() do
		if d:IsA("LuaSourceContainer") then
			check(d)
		end
	end
	return results, high
end

---------------------------------------------------------------------------
-- Tool handlers
---------------------------------------------------------------------------

local SETTING_READ_ONLY = "RobloxStudioPlus_ReadOnly"
local readOnly = plugin:GetSetting(SETTING_READ_ONLY) == true

-- Tools that change the place. Read-only mode (toolbar) refuses them, including inside batch.
local MUTATING = {
	set_properties = true, create_instance = true, create_tree = true, delete_instances = true,
	clone_instance = true, reparent_instances = true, edit_script = true, write_script = true,
	set_attributes = true, manage_tags = true, undo = true, redo = true, insert_asset = true,
	terrain_fill = true, run_luau = true,
}

local function assertWritable(tool)
	if readOnly and MUTATING[tool] then
		error(("'%s' is blocked: Studio Plus is in read-only mode (toggle 'Read-only' in the Plugins tab to allow edits)"):format(tool), 0)
	end
end

local handlers = {}

function handlers.studio_status()
	return {
		pluginVersion = VERSION,
		readOnly = readOnly,
		placeName = game.Name,
		placeId = game.PlaceId,
		gameId = game.GameId,
		isEdit = RunService:IsEdit(),
		isRunning = RunService:IsRunning(),
		selectionCount = #Selection:Get(),
	}
end

function handlers.get_tree(args)
	local root = resolve(argString(args, "path", true))
	local maxDepth = argNumber(args, "depth", 2, 0, 10)
	local maxChildren = argNumber(args, "maxChildren", 100, 1, 1000)
	local propNames = argStringList(args, "properties", true)

	local function node(inst, depth)
		local ok, children = pcall(inst.GetChildren, inst)
		children = ok and children or {}
		local entry = { name = inst.Name, className = inst.ClassName, path = pathOf(inst), childCount = #children }
		if #propNames > 0 then
			entry.properties = {}
			for _, n in propNames do
				local okProp, value = readProperty(inst, n)
				if okProp then
					entry.properties[n] = encode(value)
				end
			end
		end
		if depth < maxDepth and #children > 0 then
			local seen = {}
			for _, c in children do
				seen[c.Name] = (seen[c.Name] or 0) + 1
			end
			entry.children = {}
			for i, c in children do
				if i > maxChildren then
					entry.truncated = #children - maxChildren
					break
				end
				local child = node(c, depth + 1)
				if seen[c.Name] > 1 then
					child.dup = true
				end
				table.insert(entry.children, child)
			end
		end
		return entry
	end

	return node(root, 0)
end

function handlers.find_instances(args)
	local root = resolve(argString(args, "root", true))
	local className = argString(args, "className", true)
	local name = argString(args, "name", true)
	local pattern = argString(args, "namePattern", true)
	local tag = argString(args, "tag", true)
	local attribute = argString(args, "attribute", true)
	local limit = argNumber(args, "limit", 200, 1, 2000)

	if pattern then
		local ok, err = pcall(string.find, "", pattern)
		if not ok then
			error("invalid namePattern: " .. tostring(err), 0)
		end
	end

	local candidates
	if tag then
		candidates = {}
		for _, inst in CollectionService:GetTagged(tag) do
			if root == game or inst:IsDescendantOf(root) then
				table.insert(candidates, inst)
			end
		end
	else
		local ok, descendants = pcall(root.GetDescendants, root)
		if not ok then
			candidates = {}
			for _, service in root:GetChildren() do
				local okS, d = pcall(service.GetDescendants, service)
				table.insert(candidates, service)
				if okS then
					table.move(d, 1, #d, #candidates + 1, candidates)
				end
			end
		else
			candidates = descendants
		end
	end

	local results = {}
	local total = 0
	for _, inst in candidates do
		local match = (className == nil or inst:IsA(className))
			and (name == nil or inst.Name == name)
			and (pattern == nil or string.find(inst.Name, pattern) ~= nil)
			and (attribute == nil or inst:GetAttribute(attribute) ~= nil)
		if match then
			total += 1
			if #results < limit then
				table.insert(results, { path = pathOf(inst), className = inst.ClassName })
			end
		end
	end
	return { count = total, returned = #results, results = results }
end

function handlers.get_properties(args)
	local inst = resolve(argString(args, "path"))
	local names = args.properties ~= nil and argStringList(args, "properties") or COMMON_PROPERTIES
	local props, missing = {}, {}
	for _, n in names do
		local ok, value = readProperty(inst, n)
		if ok then
			props[n] = encode(value)
		elseif args.properties ~= nil then
			table.insert(missing, n)
		end
	end
	return {
		path = pathOf(inst),
		className = inst.ClassName,
		properties = props,
		attributes = encode(inst:GetAttributes()),
		tags = inst:GetTags(),
		missing = #missing > 0 and missing or nil,
	}
end

function handlers.set_properties(args)
	local targets = resolveAll(argStringList(args, "paths"))
	local props = argMap(args, "properties")
	local MAX_REPORTED = 25

	local function snapshot(inst)
		local values = {}
		for name in props do
			local ok, value = readProperty(inst, name)
			values[name] = ok and encode(value) or nil
		end
		return values
	end

	local before = {}
	for i, inst in targets do
		if i <= MAX_REPORTED then
			before[i] = snapshot(inst)
		end
	end
	withUndo("set properties", function()
		for _, inst in targets do
			applyProperties(inst, props)
		end
	end)
	-- Report what actually changed so the caller can verify (Roblox may clamp or round values).
	local changed = {}
	for i, inst in targets do
		if i > MAX_REPORTED then
			break
		end
		table.insert(changed, { path = pathOf(inst), before = before[i], after = snapshot(inst) })
	end
	return { count = #targets, changed = changed, truncated = #targets > MAX_REPORTED or nil }
end

function handlers.create_instance(args)
	local className = argString(args, "className")
	local parent = resolve(argString(args, "parent"))
	local name = argString(args, "name", true)
	local props = argMap(args, "properties", true)
	local created = withUndo("create " .. className, function()
		local ok, inst = pcall(Instance.new, className)
		if not ok then
			error(("cannot create '%s': %s"):format(className, tostring(inst)), 0)
		end
		if name then
			inst.Name = name
		end
		local okProps, err = pcall(applyProperties, inst, props)
		if not okProps then
			inst:Destroy()
			error(err, 0)
		end
		inst.Parent = parent
		return inst
	end)
	return { path = pathOf(created), className = created.ClassName }
end

function handlers.delete_instances(args)
	local targets = resolveAll(argStringList(args, "paths"))
	for _, inst in targets do
		if isProtected(inst) then
			error("refusing to delete protected instance " .. pathOf(inst), 0)
		end
	end
	local deleted = {}
	withUndo("delete instances", function()
		for _, inst in targets do
			table.insert(deleted, pathOf(inst))
			inst:Destroy()
		end
	end)
	return { deleted = deleted }
end

function handlers.clone_instance(args)
	local source = resolve(argString(args, "path"))
	local parentPath = argString(args, "parent", true)
	local parent = parentPath and resolve(parentPath) or source.Parent
	local name = argString(args, "name", true)
	local clone = withUndo("clone " .. source.Name, function()
		local c = source:Clone()
		if c == nil then
			error(pathOf(source) .. " cannot be cloned (Archivable is false)", 0)
		end
		if name then
			c.Name = name
		end
		c.Parent = parent
		return c
	end)
	return { path = pathOf(clone), className = clone.ClassName }
end

function handlers.reparent_instances(args)
	local targets = resolveAll(argStringList(args, "paths"))
	local parent = resolve(argString(args, "parent"))
	for _, inst in targets do
		if isProtected(inst) then
			error("refusing to move protected instance " .. pathOf(inst), 0)
		end
		if parent == inst or parent:IsDescendantOf(inst) then
			error(("cannot move %s into itself"):format(pathOf(inst)), 0)
		end
	end
	local moved = {}
	withUndo("move instances", function()
		for _, inst in targets do
			inst.Parent = parent
			table.insert(moved, pathOf(inst))
		end
	end)
	return { moved = moved }
end

function handlers.list_scripts(args)
	local root = resolve(argString(args, "root", true))
	local scripts = {}
	forEachScript(root, function(s)
		local ok, source = pcall(getSource, s)
		local entry = { path = pathOf(s), className = s.ClassName, lines = ok and countLines(source) or nil }
		local okRc, rc = readProperty(s, "RunContext")
		if okRc and rc ~= nil then
			entry.runContext = rc.Name
		end
		local okEn, enabled = readProperty(s, "Enabled")
		if okEn then
			entry.enabled = enabled
		end
		table.insert(scripts, entry)
	end)
	return { count = #scripts, scripts = scripts }
end

function handlers.read_script(args)
	local inst = resolve(argString(args, "path"))
	local source = getSource(inst)
	local lines = string.split(source, "\n")
	local first = math.floor(argNumber(args, "startLine", 1, 1))
	local last = math.floor(argNumber(args, "endLine", #lines, 1))
	last = math.min(last, #lines)
	if first > last then
		return { path = pathOf(inst), lineCount = #lines, startLine = first, source = "" }
	end
	return {
		path = pathOf(inst),
		className = inst.ClassName,
		lineCount = #lines,
		startLine = first,
		endLine = last,
		source = table.concat(lines, "\n", first, last),
	}
end

local function plainReplace(s, old, new, all)
	local out = {}
	local i, count = 1, 0
	while true do
		local a, b = string.find(s, old, i, true)
		if a == nil then
			break
		end
		table.insert(out, string.sub(s, i, a - 1))
		table.insert(out, new)
		i = b + 1
		count += 1
		if not all then
			break
		end
	end
	table.insert(out, string.sub(s, i))
	return table.concat(out), count
end

function handlers.edit_script(args)
	local inst = resolve(argString(args, "path"))
	local oldText = argString(args, "oldText")
	local newText = argString(args, "newText")
	local replaceAll = args.replaceAll == true
	if oldText == "" then
		error("oldText must not be empty", 0)
	end
	local source = getSource(inst)
	local _, occurrences = plainReplace(source, oldText, "", true)
	if occurrences == 0 then
		error("oldText was not found in " .. pathOf(inst) .. " (it must match exactly, including indentation)", 0)
	end
	if occurrences > 1 and not replaceAll then
		error(("oldText appears %d times in %s; add more context or set replaceAll"):format(occurrences, pathOf(inst)), 0)
	end
	local updated, replaced = plainReplace(source, oldText, newText, replaceAll)
	withUndo("edit " .. inst.Name, function()
		setSource(inst, updated)
	end)
	-- Show the edited region (first replacement, 2 lines of context) so the change can be checked.
	local firstAt = string.find(source, oldText, 1, true)
	local firstLine = countLines(string.sub(source, 1, firstAt))
	local lines = string.split(updated, "\n")
	local from = math.max(1, firstLine - 2)
	local to = math.min(#lines, firstLine + countLines(newText) + 1)
	return {
		path = pathOf(inst),
		replacements = replaced,
		lineCount = #lines,
		startLine = from,
		endLine = to,
		source = table.concat(lines, "\n", from, to),
	}
end

function handlers.write_script(args)
	local inst = resolve(argString(args, "path"))
	local source = argString(args, "source")
	getSource(inst) -- validates that it is a script
	withUndo("write " .. inst.Name, function()
		setSource(inst, source)
	end)
	return { path = pathOf(inst), lineCount = countLines(source) }
end

function handlers.search_scripts(args)
	local query = argString(args, "query")
	local plain = args.plain ~= false
	local caseSensitive = args.caseSensitive == true
	local root = resolve(argString(args, "root", true))
	local limit = argNumber(args, "limit", 100, 1, 1000)
	if query == "" then
		error("query must not be empty", 0)
	end
	if not plain then
		local ok, err = pcall(string.find, "", query)
		if not ok then
			error("invalid Lua pattern: " .. tostring(err), 0)
		end
	end
	-- Lowercasing a Lua pattern would change classes like %S into %s, so patterns are always case-sensitive.
	if not plain then
		caseSensitive = true
	end
	local needle = caseSensitive and query or string.lower(query)
	local matches, total, scanned = {}, 0, 0
	forEachScript(root, function(s)
		local ok, source = pcall(getSource, s)
		if not ok then
			return
		end
		scanned += 1
		for lineNo, line in string.split(source, "\n") do
			local hay = caseSensitive and line or string.lower(line)
			if string.find(hay, needle, 1, plain) then
				total += 1
				if #matches < limit then
					table.insert(matches, { path = pathOf(s), line = lineNo, text = string.sub(line, 1, 300) })
				end
			end
		end
	end)
	return { scriptsScanned = scanned, count = total, returned = #matches, matches = matches }
end

function handlers.get_selection()
	local out = {}
	for _, inst in Selection:Get() do
		table.insert(out, { path = pathOf(inst), className = inst.ClassName })
	end
	return { selection = out }
end

function handlers.set_selection(args)
	local targets = resolveAll(argStringList(args, "paths"))
	Selection:Set(targets)
	return { selected = #targets }
end

function handlers.set_attributes(args)
	local targets = resolveAll(argStringList(args, "paths"))
	local attrs = argMap(args, "attributes", true)
	local remove = argStringList(args, "remove", true)
	withUndo("set attributes", function()
		for _, inst in targets do
			for name, raw in attrs do
				local value = decode(raw, inst:GetAttribute(name))
				local ok, err = pcall(inst.SetAttribute, inst, name, value)
				if not ok then
					error(("%s attribute '%s': %s"):format(pathOf(inst), tostring(name), tostring(err)), 0)
				end
			end
			for _, name in remove do
				inst:SetAttribute(name, nil)
			end
		end
	end)
	local result = {}
	for _, inst in targets do
		table.insert(result, { path = pathOf(inst), attributes = encode(inst:GetAttributes()) })
	end
	return { instances = result }
end

function handlers.manage_tags(args)
	local targets = resolveAll(argStringList(args, "paths"))
	local add = argStringList(args, "add", true)
	local remove = argStringList(args, "remove", true)
	withUndo("tags", function()
		for _, inst in targets do
			for _, tag in add do
				inst:AddTag(tag)
			end
			for _, tag in remove do
				inst:RemoveTag(tag)
			end
		end
	end)
	local result = {}
	for _, inst in targets do
		table.insert(result, { path = pathOf(inst), tags = inst:GetTags() })
	end
	return { instances = result }
end

function handlers.undo(args)
	local steps = math.floor(argNumber(args, "steps", 1, 1, 50))
	for _ = 1, steps do
		ChangeHistoryService:Undo()
	end
	return { undone = steps }
end

function handlers.redo(args)
	local steps = math.floor(argNumber(args, "steps", 1, 1, 50))
	for _ = 1, steps do
		ChangeHistoryService:Redo()
	end
	return { redone = steps }
end

function handlers.camera_get()
	local camera = workspace.CurrentCamera
	local cf = camera.CFrame
	return {
		position = { cf.X, cf.Y, cf.Z },
		lookVector = { cf.LookVector.X, cf.LookVector.Y, cf.LookVector.Z },
		focus = { camera.Focus.X, camera.Focus.Y, camera.Focus.Z },
		fov = camera.FieldOfView,
	}
end

function handlers.camera_set(args)
	local camera = workspace.CurrentCamera
	if args.fov ~= nil then
		camera.FieldOfView = argNumber(args, "fov", 70, 1, 120)
	end
	if type(args.target) == "string" then
		local cf, size = boundingBox(resolve(args.target))
		local radius = size.Magnitude / 2
		local distance = radius * argNumber(args, "distance", 1.5, 0.1) / math.tan(math.rad(camera.FieldOfView / 2))
		local position = args.position ~= nil and Vector3.new(numbers(args.position, 3, "position"))
			or (cf.Position + Vector3.new(1, 0.6, 1).Unit * distance)
		camera.CFrame = safeLookAt(position, cf.Position, camera.CFrame)
		camera.Focus = CFrame.new(cf.Position)
	elseif args.position ~= nil then
		local position = Vector3.new(numbers(args.position, 3, "position"))
		local look = args.lookAt ~= nil and Vector3.new(numbers(args.lookAt, 3, "lookAt"))
			or (position + camera.CFrame.LookVector)
		camera.CFrame = safeLookAt(position, look, camera.CFrame)
		camera.Focus = CFrame.new(look)
	end
	return handlers.camera_get()
end

local function playFrames(frames, easing, startDelay)
	local total = frames[#frames].time
	local camera = workspace.CurrentCamera
	local originalFov = camera.FieldOfView

	local function apply(t)
		local u = total > 0 and t / total or 1
		if easing == "smooth" then
			u = smoothstep(math.clamp(u, 0, 1))
		end
		local pos, look, fov = samplePath(frames, u * total)
		camera.CFrame = safeLookAt(pos, look, camera.CFrame)
		camera.Focus = CFrame.new(look)
		if fov then
			camera.FieldOfView = fov
		end
	end

	apply(0)
	if startDelay > 0 then
		print(("[Studio Plus] Camera move starts in %.1fs — start recording now."):format(startDelay))
		task.wait(startDelay)
	end
	local start = os.clock()
	while true do
		local elapsed = os.clock() - start
		apply(math.min(elapsed, total))
		if elapsed >= total then
			break
		end
		RunService.Heartbeat:Wait()
	end
	if frames[#frames].fov == nil then
		camera.FieldOfView = originalFov
	end
	return { keyframes = #frames, seconds = total, finalCamera = handlers.camera_get() }
end

function handlers.camera_path(args)
	local duration = argNumber(args, "duration", 8, 0.5, 120)
	local startDelay = argNumber(args, "startDelay", 3, 0, 30)
	local easing = args.easing == "linear" and "linear" or "smooth"
	return playFrames(buildKeyframes(args.keyframes, duration), easing, startDelay)
end

function handlers.camera_orbit(args)
	local cf, size = boundingBox(resolve(argString(args, "target")))
	local center = cf.Position
	local radius = argNumber(args, "radius", math.max(size.Magnitude * 1.2, 10), 1)
	local height = argNumber(args, "height", size.Y * 0.5 + radius * 0.3)
	local degrees = argNumber(args, "degrees", 360, -1080, 1080)
	local duration = argNumber(args, "duration", 10, 0.5, 120)
	local startDelay = argNumber(args, "startDelay", 3, 0, 30)
	local easing = args.easing == "smooth" and "smooth" or "linear"
	local fov = args.fov ~= nil and argNumber(args, "fov", 70, 1, 120) or nil
	if degrees == 0 then
		error("degrees must not be 0", 0)
	end

	-- Start from the camera's current bearing so the move begins where the user is looking from.
	local offset = workspace.CurrentCamera.CFrame.Position - center
	local startAngle = math.atan2(offset.Z, offset.X)
	local steps = math.max(4, math.ceil(math.abs(degrees) / 30))
	local frames = {}
	for i = 0, steps do
		local angle = startAngle + math.rad(degrees) * i / steps
		table.insert(frames, {
			pos = center + Vector3.new(math.cos(angle) * radius, height, math.sin(angle) * radius),
			look = center,
			fov = fov,
			time = duration * i / steps,
		})
	end
	return playFrames(frames, easing, startDelay)
end

local MAX_TREE_NODES = 2000

function handlers.create_tree(args)
	local parent = resolve(argString(args, "parent"))
	local spec = argMap(args, "tree")
	local count = 0

	local function build(node, where)
		if type(node) ~= "table" or type(node.className) ~= "string" then
			error(("%s: every node needs a string className"):format(where), 0)
		end
		count += 1
		if count > MAX_TREE_NODES then
			error(("tree is larger than %d nodes"):format(MAX_TREE_NODES), 0)
		end
		local ok, inst = pcall(Instance.new, node.className)
		if not ok then
			error(("%s: cannot create '%s': %s"):format(where, node.className, tostring(inst)), 0)
		end
		if node.name ~= nil then
			if type(node.name) ~= "string" then
				error(where .. ": name must be a string", 0)
			end
			inst.Name = node.name
		end
		local label = where .. "/" .. inst.Name
		if node.properties ~= nil then
			if type(node.properties) ~= "table" then
				error(label .. ": properties must be an object", 0)
			end
			applyProperties(inst, node.properties)
		end
		if type(node.attributes) == "table" then
			for k, v in node.attributes do
				inst:SetAttribute(k, decode(v, nil))
			end
		end
		if type(node.tags) == "table" then
			for _, tag in node.tags do
				inst:AddTag(tag)
			end
		end
		if node.children ~= nil then
			if type(node.children) ~= "table" then
				error(label .. ": children must be a list", 0)
			end
			for _, child in node.children do
				build(child, label).Parent = inst
			end
		end
		return inst
	end

	local root = withUndo("create tree", function()
		local built = build(spec, pathOf(parent))
		built.Parent = parent
		return built
	end)
	return { path = pathOf(root), className = root.ClassName, instancesCreated = count }
end

function handlers.insert_asset(args)
	local assetId = argRequiredNumber(args, "assetId")
	if assetId <= 0 or assetId % 1 ~= 0 then
		error("assetId must be a positive integer", 0)
	end
	local parent = resolve(argString(args, "parent", true) or "Workspace")
	local allowSuspicious = args.allowSuspicious == true
	local InsertService = game:GetService("InsertService")
	local ok, container = pcall(InsertService.LoadAsset, InsertService, assetId)
	if not ok then
		error(("could not load asset %d: %s"):format(assetId, tostring(container)), 0)
	end

	-- Audit while the asset is still outside the place.
	local findings, high = auditTree(container)
	local scripts = {}
	for _, d in container:GetDescendants() do
		if d:IsA("LuaSourceContainer") then
			table.insert(scripts, d.ClassName .. " " .. d:GetFullName())
		end
	end
	if high > 0 and not allowSuspicious then
		container:Destroy()
		return { assetId = assetId, inserted = {}, refused = true, scripts = scripts, findings = findings, note = "Asset contains high-severity script patterns and was NOT inserted. Review the findings; pass allowSuspicious=true only if the user confirms." }
	end

	local inserted = {}
	withUndo("insert asset " .. assetId, function()
		for _, child in container:GetChildren() do
			child.Parent = parent
			table.insert(inserted, { path = pathOf(child), className = child.ClassName })
		end
	end)
	container:Destroy()
	return { assetId = assetId, inserted = inserted, scripts = scripts, findings = findings }
end

function handlers.audit_scripts(args)
	local root = resolve(argString(args, "root", true))
	local minSeverity = args.minSeverity
	local rank = { low = 1, medium = 2, high = 3 }
	local floor = rank[minSeverity] or 1
	local results, total = {}, 0
	local function collect(container)
		local findings = auditTree(container)
		for _, f in findings do
			if rank[f.severity] >= floor then
				total += 1
				if #results < 500 then
					table.insert(results, f)
				end
			end
		end
	end
	if root == game then
		for _, service in game:GetChildren() do
			pcall(collect, service)
		end
	else
		collect(root)
	end
	return { count = total, returned = #results, findings = results }
end

function handlers.terrain_fill(args)
	local shape = argString(args, "shape")
	local material = enumItemFrom("Material", argString(args, "material"))
	local position = Vector3.new(numbers(args.position, 3, "position"))
	local rotation = CFrame.new()
	if args.orientation ~= nil then
		local rx, ry, rz = numbers(args.orientation, 3, "orientation")
		rotation = CFrame.fromOrientation(math.rad(rx), math.rad(ry), math.rad(rz))
	end
	local cf = CFrame.new(position) * rotation
	local terrain = workspace.Terrain
	withUndo("terrain " .. shape, function()
		if shape == "block" then
			terrain:FillBlock(cf, Vector3.new(numbers(args.size, 3, "size")), material)
		elseif shape == "ball" then
			terrain:FillBall(position, argRequiredNumber(args, "radius", 0.5, 2048), material)
		elseif shape == "cylinder" then
			terrain:FillCylinder(cf, argRequiredNumber(args, "height", 0.5, 4096), argRequiredNumber(args, "radius", 0.5, 2048), material)
		else
			error("shape must be block, ball or cylinder", 0)
		end
	end)
	return { shape = shape, material = material.Name, position = { position.X, position.Y, position.Z } }
end

function handlers.open_script(args)
	local inst = resolve(argString(args, "path"))
	if not inst:IsA("LuaSourceContainer") then
		error(pathOf(inst) .. " is not a script", 0)
	end
	local line = math.floor(argNumber(args, "line", 1, 1))
	plugin:OpenScript(inst, line)
	return { opened = pathOf(inst), line = line }
end

function handlers.get_bounds(args)
	local out = {}
	for _, inst in resolveAll(argStringList(args, "paths")) do
		local cf, size = boundingBox(inst)
		table.insert(out, {
			path = pathOf(inst),
			center = { cf.X, cf.Y, cf.Z },
			size = { size.X, size.Y, size.Z },
			bottomY = cf.Y - size.Y / 2,
			topY = cf.Y + size.Y / 2,
			cframe = encode(cf),
		})
	end
	return { bounds = out }
end

function handlers.raycast(args)
	local origin = Vector3.new(numbers(args.origin, 3, "origin"))
	local direction = args.direction ~= nil and Vector3.new(numbers(args.direction, 3, "direction"))
		or Vector3.new(0, -1000, 0)
	local params = RaycastParams.new()
	local ignore = resolveAll(argStringList(args, "ignore", true))
	if #ignore > 0 then
		params.FilterType = Enum.RaycastFilterType.Exclude
		params.FilterDescendantsInstances = ignore
	end
	local hit = workspace:Raycast(origin, direction, params)
	if hit == nil then
		return { hit = false }
	end
	return {
		hit = true,
		instance = hit.Instance and pathOf(hit.Instance) or nil,
		position = { hit.Position.X, hit.Position.Y, hit.Position.Z },
		normal = { hit.Normal.X, hit.Normal.Y, hit.Normal.Z },
		material = hit.Material.Name,
		distance = hit.Distance,
	}
end

local BATCH_BLOCKED = { batch = true, undo = true, redo = true, camera_path = true, camera_orbit = true }

function handlers.batch(args)
	local steps = args.steps
	if type(steps) ~= "table" or #steps == 0 or #steps > 50 then
		error("steps must be a list of 1-50 {tool, args}", 0)
	end
	for i, step in steps do
		if type(step) ~= "table" or type(step.tool) ~= "string" or handlers[step.tool] == nil then
			error(("step %d: unknown tool %s"):format(i, tostring(type(step) == "table" and step.tool)), 0)
		end
		if BATCH_BLOCKED[step.tool] then
			error(("step %d: %s cannot run inside batch"):format(i, step.tool), 0)
		end
		assertWritable(step.tool)
	end
	local results = {}
	withUndo("batch", function()
		for i, step in steps do
			local ok, result = pcall(handlers[step.tool], type(step.args) == "table" and step.args or {})
			if not ok then
				error(("step %d (%s) failed, whole batch rolled back: %s"):format(i, step.tool, tostring(result)), 0)
			end
			results[i] = { tool = step.tool, result = result }
		end
	end)
	return { steps = #results, results = results }
end

function handlers.get_output(args)
	local since = argNumber(args, "since", 0, 0)
	local limit = argNumber(args, "limit", 100, 1, 500)
	local wanted = nil
	if args.types ~= nil then
		wanted = {}
		for _, t in argStringList(args, "types") do
			wanted[t] = true
		end
	end
	local out, more = {}, false
	for _, entry in outputLog do
		if entry.seq > since and (wanted == nil or wanted[entry.type]) then
			if #out >= limit then
				more = true
				break
			end
			table.insert(out, entry)
		end
	end
	local nextSince = #out > 0 and out[#out].seq or math.max(since, outputSeq)
	local dropped = #outputLog > 0 and since < outputLog[1].seq - 1
	return { messages = out, nextSince = nextSince, more = more, olderMessagesDropped = dropped or nil }
end

function handlers.run_luau(args)
	local code = argString(args, "code")
	local fn, compileError = loadstring(code, "=claude")
	if fn == nil then
		error("compile error: " .. tostring(compileError), 0)
	end
	local printed = {}
	local function capture(prefix)
		return function(...)
			local parts = {}
			for i = 1, select("#", ...) do
				table.insert(parts, tostring((select(i, ...))))
			end
			table.insert(printed, prefix .. table.concat(parts, " "))
		end
	end
	local env = setmetatable({
		print = capture(""),
		warn = capture("[warn] "),
		plugin = plugin,
	}, { __index = getfenv(1) })
	setfenv(fn, env)
	local results = withUndo("run Luau", function()
		return table.pack(fn())
	end)
	local returned = {}
	for i = 1, results.n do
		local value = results[i]
		returned[i] = value == nil and { ["$type"] = "nil" } or encode(value)
	end
	return { output = printed, returned = returned }
end

---------------------------------------------------------------------------
-- Bridge loop
---------------------------------------------------------------------------

local enabled = plugin:GetSetting(SETTING_ENABLED) == true
local loopRunning = false
local unloading = false

local toolbar = plugin:CreateToolbar("Studio Plus")
local button = toolbar:CreateButton(
	"Connect",
	"Connect Roblox Studio to Claude (Roblox Studio Plus bridge on localhost:" .. PORT .. ")",
	"" -- no custom icon asset; Studio shows the button text
)
button.ClickableWhenViewportHidden = true

local readOnlyButton = toolbar:CreateButton(
	"Read-only",
	"When on, Claude can inspect the place but every tool that changes it is refused",
	""
)
readOnlyButton.ClickableWhenViewportHidden = true

local activityButton = toolbar:CreateButton("Activity", "Show what Claude is doing in this place", "")
activityButton.ClickableWhenViewportHidden = true

---------------------------------------------------------------------------
-- Activity panel: a live log of every command Claude runs
---------------------------------------------------------------------------

local ACTIVITY_LIMIT = 100
local widget = plugin:CreateDockWidgetPluginGui(
	"RobloxStudioPlusActivity",
	DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Right, false, false, 340, 280, 220, 140)
)
widget.Title = "Studio Plus — Claude activity"
widget.Name = "RobloxStudioPlusActivity"

local function themeColor(styleColor)
	local ok, color = pcall(function()
		return settings().Studio.Theme:GetColor(styleColor)
	end)
	return ok and color or nil
end

local root = Instance.new("Frame")
root.Size = UDim2.fromScale(1, 1)
root.BorderSizePixel = 0
root.Parent = widget

local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(1, -8, 0, 22)
statusLabel.Position = UDim2.fromOffset(4, 2)
statusLabel.BackgroundTransparency = 1
statusLabel.TextXAlignment = Enum.TextXAlignment.Left
statusLabel.Font = Enum.Font.SourceSansBold
statusLabel.TextSize = 15
statusLabel.Parent = root

local logFrame = Instance.new("ScrollingFrame")
logFrame.Size = UDim2.new(1, 0, 1, -26)
logFrame.Position = UDim2.fromOffset(0, 26)
logFrame.BackgroundTransparency = 1
logFrame.BorderSizePixel = 0
logFrame.ScrollBarThickness = 6
logFrame.AutomaticCanvasSize = Enum.AutomaticSize.Y
logFrame.CanvasSize = UDim2.new()
logFrame.Parent = root

local logLayout = Instance.new("UIListLayout")
logLayout.SortOrder = Enum.SortOrder.LayoutOrder
logLayout.Parent = logFrame

local function applyTheme()
	local bg = themeColor(Enum.StudioStyleGuideColor.MainBackground)
	local text = themeColor(Enum.StudioStyleGuideColor.MainText)
	if bg then
		root.BackgroundColor3 = bg
	end
	if text then
		statusLabel.TextColor3 = text
		for _, entry in logFrame:GetChildren() do
			if entry:IsA("TextLabel") and entry:GetAttribute("Kind") == "ok" then
				entry.TextColor3 = text
			end
		end
	end
end

local activityOrder = 0
local function logActivity(kind, message)
	activityOrder += 1
	local entry = Instance.new("TextLabel")
	entry.LayoutOrder = -activityOrder -- newest first
	entry.Size = UDim2.new(1, -10, 0, 0)
	entry.AutomaticSize = Enum.AutomaticSize.Y
	entry.BackgroundTransparency = 1
	entry.TextWrapped = true
	entry.TextXAlignment = Enum.TextXAlignment.Left
	entry.Font = Enum.Font.Code
	entry.TextSize = 13
	entry.Text = os.date("%H:%M:%S") .. "  " .. message
	entry:SetAttribute("Kind", kind)
	if kind == "error" then
		entry.TextColor3 = themeColor(Enum.StudioStyleGuideColor.ErrorText) or Color3.fromRGB(230, 80, 80)
	elseif kind == "blocked" then
		entry.TextColor3 = themeColor(Enum.StudioStyleGuideColor.WarningText) or Color3.fromRGB(230, 170, 60)
	else
		entry.TextColor3 = themeColor(Enum.StudioStyleGuideColor.MainText) or Color3.new(1, 1, 1)
	end
	entry.Parent = logFrame
	local entries = {}
	for _, child in logFrame:GetChildren() do
		if child:IsA("TextLabel") then
			table.insert(entries, child)
		end
	end
	if #entries > ACTIVITY_LIMIT then
		table.sort(entries, function(a, b)
			return a.LayoutOrder > b.LayoutOrder
		end)
		entries[1]:Destroy() -- oldest has the highest LayoutOrder
	end
end

-- Short human description of a command's target for the log.
local function describeArgs(args)
	if type(args) ~= "table" then
		return ""
	end
	local target = args.path or args.root or args.parent or args.target or args.query or args.className
	if target == nil and type(args.paths) == "table" then
		target = tostring(args.paths[1]) .. (#args.paths > 1 and (" +" .. (#args.paths - 1)) or "")
	end
	if target == nil and type(args.steps) == "table" then
		target = #args.steps .. " steps"
	end
	return target and ("  " .. string.sub(tostring(target), 1, 80)) or ""
end

local function request(method, path, body)
	return HttpService:RequestAsync({
		Url = BASE_URL .. path,
		Method = method,
		Headers = {
			["Content-Type"] = "application/json",
			["X-Studio-Plus"] = VERSION,
			["X-Studio-Plus-Session"] = SESSION_ID,
		},
		Body = body and HttpService:JSONEncode(body) or nil,
	})
end

local function runCommand(command)
	local tool = type(command.tool) == "string" and command.tool or "?"
	local handler = handlers[tool]
	if handler == nil then
		return { id = command.id, ok = false, error = "unknown tool: " .. tool }
	end
	local args = type(command.args) == "table" and command.args or {}
	local label = tool .. describeArgs(args)
	local writable, blockedError = pcall(assertWritable, tool)
	if not writable then
		logActivity("blocked", "⛔ " .. label)
		return { id = command.id, ok = false, error = tostring(blockedError) }
	end
	local ok, result
	if MUTATING[tool] or tool == "batch" then
		ok, result = pcall(handler, args)
	else
		-- Read-only tools can safely cache sibling indexes for the whole command.
		ok, result = pcall(withPathCache, handler, args)
	end
	if not ok then
		logActivity("error", "✗ " .. label .. " — " .. string.sub(tostring(result), 1, 160))
		return { id = command.id, ok = false, error = tostring(result) }
	end
	logActivity("ok", (MUTATING[tool] and "✎ " or "· ") .. label)
	return { id = command.id, ok = true, result = result }
end

local function postResult(message)
	local okEncode, err = pcall(HttpService.JSONEncode, HttpService, message)
	if not okEncode then
		message = { id = message.id, ok = false, error = "result could not be serialized: " .. tostring(err) }
	end
	local ok, postErr = pcall(request, "POST", "/result", message)
	if not ok then
		warn("[Studio Plus] could not send result: " .. tostring(postErr))
	end
end

local currentState = "off"
local function setStatus(newState)
	currentState = newState or currentState
	local labels = {
		off = "○ Disconnected",
		starting = "… Connecting",
		connected = "● Connected to Claude",
		unreachable = "○ Waiting for Claude Code",
		busy = "○ Another Studio window is connected",
	}
	statusLabel.Text = (labels[currentState] or currentState) .. (readOnly and "  ·  READ-ONLY" or "")
end

local function bridgeLoop()
	if loopRunning then
		return
	end
	loopRunning = true
	local failures = 0
	local state = "starting" -- starting | connected | unreachable | busy
	local function setState(newState, detail)
		if newState == state then
			return
		end
		state = newState
		setStatus(newState)
		if newState == "connected" then
			print("[Studio Plus] Connected to Claude (" .. game.Name .. ").")
		elseif newState == "unreachable" then
			warn(("[Studio Plus] Claude bridge not reachable at %s (%s). Waiting for Claude Code to start it…"):format(BASE_URL, detail))
		elseif newState == "busy" then
			warn("[Studio Plus] Another Studio window is already connected to Claude. Press Connect there to disconnect it, then this window will take over.")
		end
	end

	while enabled and not unloading do
		local ok, response = pcall(request, "GET", "/poll")
		if ok and response.StatusCode == 200 then
			failures = 0
			setState("connected")
			local okDecode, command = pcall(HttpService.JSONDecode, HttpService, response.Body)
			if okDecode and type(command) == "table" and type(command.id) == "string" then
				if enabled and not unloading then
					postResult(runCommand(command))
				else
					postResult({ id = command.id, ok = false, error = "Studio Plus was disconnected in Studio before this command ran." })
				end
			end
		elseif ok and response.StatusCode == 204 then
			failures = 0
			setState("connected")
		elseif ok and response.StatusCode == 409 then
			setState("busy")
			task.wait(5)
		else
			failures += 1
			setState("unreachable", ok and ("HTTP " .. tostring(response.StatusCode)) or tostring(response))
			task.wait(math.min(2 + failures, 10))
		end
	end
	loopRunning = false
end

local function setEnabled(value)
	enabled = value
	plugin:SetSetting(SETTING_ENABLED, value)
	button:SetActive(value)
	if value then
		print(readOnly and "[Studio Plus] Bridge enabled (read-only) — Claude can inspect but not change this place."
			or "[Studio Plus] Bridge enabled — Claude can now read and edit this place.")
		setStatus("starting")
		task.spawn(bridgeLoop)
	else
		print("[Studio Plus] Bridge disabled.")
		setStatus("off")
	end
end

local function setReadOnly(value)
	readOnly = value
	plugin:SetSetting(SETTING_READ_ONLY, value)
	readOnlyButton:SetActive(value)
	print(value and "[Studio Plus] Read-only ON: Claude cannot change this place." or "[Studio Plus] Read-only OFF: Claude can edit this place.")
	logActivity("blocked", value and "Read-only mode ON" or "Read-only mode OFF")
	setStatus()
end

readOnlyButton.Click:Connect(function()
	setReadOnly(not readOnly)
end)

activityButton.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)
widget:GetPropertyChangedSignal("Enabled"):Connect(function()
	activityButton:SetActive(widget.Enabled)
end)

local themeConnection = settings().Studio.ThemeChanged:Connect(applyTheme)
applyTheme()
readOnlyButton:SetActive(readOnly)
activityButton:SetActive(widget.Enabled)

button.Click:Connect(function()
	setEnabled(not enabled)
end)

plugin.Unloading:Connect(function()
	unloading = true
	outputConnection:Disconnect()
	themeConnection:Disconnect()
end)

button:SetActive(enabled)
setStatus(enabled and "starting" or "off")
if enabled then
	task.spawn(bridgeLoop)
end
