-- Run by test/luau.test.mjs: the plugin's path helpers are spliced in below this harness.
-- Minimal Instance mock: Name, Parent, GetChildren, FindFirstChild, GetFullName.
local Mock = {}
Mock.__index = Mock

local function new(name, parent)
	local self = setmetatable({ Name = name, _children = {} }, Mock)
	if parent then
		self.Parent = parent
		table.insert(parent._children, self)
	end
	return self
end
function Mock:GetChildren()
	return table.clone(self._children)
end
function Mock:FindFirstChild(name)
	for _, c in self._children do
		if c.Name == name then
			return c
		end
	end
	return nil
end
function Mock:GetFullName()
	local names, node = {}, self
	while node and node ~= game do
		table.insert(names, 1, node.Name)
		node = node.Parent
	end
	return table.concat(names, ".")
end

game = new("Game")
function game.FindService(_, name)
	return game:FindFirstChild(name)
end

--@@PATH_HELPERS@@

local workspace = new("Workspace", game)
local map = new("Map", workspace)
local a1 = new("Tree", map)
local a2 = new("Tree", map)
local a3 = new("Tree", map)
local solo = new("Rock", map)
local dotted = new("Config.v2", new("Modules", new("ReplicatedStorage", game)))
local detached = new("Loose")

local function eq(a, b, msg)
	if a ~= b then
		error(("%s: expected %s, got %s"):format(msg, tostring(b), tostring(a)), 2)
	end
end

eq(pathOf(solo), "Workspace.Map.Rock", "unique name has no index")
eq(pathOf(a1), "Workspace.Map.Tree[1]", "first duplicate")
eq(pathOf(a2), "Workspace.Map.Tree[2]", "second duplicate")
eq(pathOf(a3), "Workspace.Map.Tree[3]", "third duplicate")
eq(pathOf(dotted), "ReplicatedStorage/Modules/Config.v2", "dotted names switch to slash")
eq(pathOf(game), "game", "game")
eq(pathOf(detached), "<not in DataModel>.Loose", "detached")

for _, inst in { solo, a1, a2, a3, dotted, map } do
	eq(resolve(pathOf(inst)), inst, "round trip " .. pathOf(inst))
end
eq(resolve("game.Workspace.Map.Tree"), a1, "plain name resolves to first")
eq(resolve("Workspace/Map/Tree[2]"), a2, "slash + index")
eq(resolve(""), game, "empty path is game")

local ok, err = pcall(resolve, "Workspace.Map.Tree[9]")
assert(not ok and string.find(err, "path not found", 1, true), "missing index errors")
ok, err = pcall(resolve, "Workspace.Nope")
assert(not ok and string.find(err, "no child 'Nope'", 1, true), "missing child errors")

-- The per-command cache must give the same answers as the uncached path.
withPathCache(function()
	for _, inst in { solo, a1, a2, a3, dotted } do
		eq(resolve(pathOf(inst)), inst, "cached round trip " .. pathOf(inst))
	end
	eq(pathOf(a3), "Workspace.Map.Tree[3]", "cached index")
end)
local okErr = pcall(withPathCache, function()
	error("boom", 0)
end)
assert(not okErr, "withPathCache propagates errors")
assert(segmentCache == nil, "cache is cleared after the command")

-- A real child literally named "Tree[2]" wins over the index syntax.
local literal = new("Tree[2]", map)
eq(resolve("Workspace.Map.Tree[2]"), literal, "literal bracket name preferred")

print("paths OK")
