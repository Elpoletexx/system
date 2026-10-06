-- Run by test/luau.test.mjs: the plugin's audit rules are spliced in below.
--@@AUDIT@@

local function rules(source)
	local ids = {}
	for _, f in auditSource(source) do
		ids[f.rule] = (ids[f.rule] or 0) + 1
	end
	return ids
end

local hits = rules([[
local m = require(4123456789)
local x = require( tonumber("123") )
loadstring(code)()
local hook = "https://discord.com/api/webhooks/1/abc"
local old = "https://discordapp.com/api/webhooks/1/abc"
getfenv(0).x = 1
game:GetService("HttpService"):PostAsync(url, body)
local s = "\104\101\108\108\111"
print(string.reverse("olleh"))
]])
assert(hits["remote-require"] == 1, "remote-require")
assert(hits["remote-require-tonumber"] == 1, "remote-require-tonumber")
assert(hits["loadstring"] == 1, "loadstring")
assert(hits["discord-webhook"] == 2, "discord-webhook")
assert(hits["getfenv"] == 1, "getfenv")
assert(hits["http-out"] == 1, "http-out")
assert(hits["escaped-bytes"] == 1, "escaped-bytes")
assert(hits["string-reverse"] == 1, "string-reverse")

-- Ordinary game code must stay clean.
local clean = rules([[
local Players = game:GetService("Players")
local Config = require(script.Parent.Config)
local Remote = game.ReplicatedStorage:WaitForChild("Fire")
Remote.OnServerEvent:Connect(function(player, target)
	if typeof(target) ~= "Instance" then return end
end)
]])
assert(next(clean) == nil, "false positive on ordinary code")

local long = rules(string.rep("a", 2500))
assert(long["long-line"] == 1, "long-line")
print("audit OK")
