-- Run by test/luau.test.mjs: escapePattern from the plugin is spliced in below.
--@@ESCAPE@@

local function word(name)
	return "%f[%w_]" .. escapePattern(name) .. "%f[^%w_]"
end

assert(string.find('local r = RS:WaitForChild("Fire")', word("Fire")), "finds quoted name")
assert(not string.find("remote:FireServer(x)", word("Fire")), "Fire must not match FireServer")
assert(not string.find("local Fireball = 1", word("Fire")), "Fire must not match Fireball")
assert(string.find("RS.Shoot_v2.OnServerEvent", word("Shoot_v2")), "underscore names")
assert(string.find('RS["Hit.Detect"]', word("Hit.Detect")), "dots are escaped")
assert(not string.find("HitxDetect", word("Hit.Detect")), "dot is literal, not wildcard")
assert(pcall(string.find, "a", word("[weird]%$^")), "magic characters never break the pattern")
print("remotes OK")
