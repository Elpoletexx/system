// Tool catalog exposed over MCP. Every tool is executed inside Roblox Studio by
// the companion plugin (studio-plugin/RobloxStudioPlus.server.lua); this file
// only describes inputs. The Studio side re-validates every argument.

const path = { type: "string", description: 'Instance path, e.g. "Workspace.Map.Spawn" or "ServerScriptService/Main" (use "/" when a name contains a dot).' };
const paths = { type: "array", items: { type: "string" }, minItems: 1, description: "List of instance paths." };
const valueMap = {
  type: "object",
  description:
    'Property/attribute name -> value. Plain JSON is coerced to the current property type (e.g. [x,y,z] for Vector3, "#ff8800" for Color3, "Neon" for Enum.Material). Tagged form is always accepted: {"$type":"Vector3","value":[1,2,3]}.',
  additionalProperties: true,
};

const keyframe = {
  type: "object",
  properties: {
    position: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 },
    lookAt: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3, description: "World point the camera faces." },
    target: { type: "string", description: "Instance path to look at instead of lookAt." },
    fov: { type: "number", minimum: 1, maximum: 120 },
    time: { type: "number", minimum: 0, description: "Seconds from start. Omit on all keyframes to space them evenly." },
  },
  required: ["position"],
};

export const TOOLS = [
  {
    name: "studio_status",
    description: "Check the bridge connection and report the open place, Studio mode, selection count and whether Studio Plus is in read-only mode (edits refused). Call this first.",
    inputSchema: { type: "object", properties: {} },
    local: true,
  },
  {
    name: "get_tree",
    description: "Return the instance hierarchy under a path (name, class, child count, optional properties). Duplicated sibling names are flagged dup=true and their paths carry an index like \"Part[2]\" so each one stays addressable.",
    inputSchema: {
      type: "object",
      properties: {
        path: { ...path, default: "game" },
        depth: { type: "integer", minimum: 0, maximum: 10, default: 2 },
        maxChildren: { type: "integer", minimum: 1, maximum: 1000, default: 100 },
        properties: { type: "array", items: { type: "string" }, description: "Also return these properties for every node (e.g. [\"Position\",\"Anchored\"])." },
      },
    },
  },
  {
    name: "find_instances",
    description: "Search descendants by class (IsA), exact name, Lua name pattern, tag, attribute, or property values (where). Returns paths, optionally with properties.",
    inputSchema: {
      type: "object",
      properties: {
        root: { ...path, default: "game" },
        className: { type: "string", description: "Matches with IsA, so 'BasePart' finds Parts, MeshParts, etc." },
        name: { type: "string" },
        namePattern: { type: "string", description: "Lua string pattern matched against Name." },
        tag: { type: "string" },
        attribute: { type: "string", description: "Only instances that have this attribute set." },
        where: {
          type: "object",
          additionalProperties: true,
          description: 'Property filters, all must match: {"Anchored": false, "Material": "Neon", "Color": "#ff0000", "Size": [4,1,2]}. Numbers/vectors compare with a small tolerance.',
        },
        properties: { type: "array", items: { type: "string" }, description: "Also return these properties for each result." },
        limit: { type: "integer", minimum: 1, maximum: 2000, default: 200 },
      },
    },
  },
  {
    name: "get_properties",
    description: "Read properties, attributes and tags of one instance. Without 'properties' a broad list of common properties is tried and the ones that exist are returned.",
    inputSchema: {
      type: "object",
      properties: { path, properties: { type: "array", items: { type: "string" } } },
      required: ["path"],
    },
  },
  {
    name: "set_properties",
    mutating: true,
    description: "Set properties on one or more instances as a single undo step. If any assignment fails, the whole step is rolled back.",
    inputSchema: { type: "object", properties: { paths, properties: valueMap }, required: ["paths", "properties"] },
  },
  {
    name: "create_instance",
    mutating: true,
    description: "Create an instance (properties are applied before parenting). Undoable.",
    inputSchema: {
      type: "object",
      properties: { className: { type: "string" }, parent: path, name: { type: "string" }, properties: valueMap },
      required: ["className", "parent"],
    },
  },
  {
    name: "delete_instances",
    mutating: true,
    description: "Destroy instances as a single undo step. Services, the DataModel, Terrain and the current camera are refused.",
    inputSchema: { type: "object", properties: { paths }, required: ["paths"] },
  },
  {
    name: "clone_instance",
    mutating: true,
    description: "Clone an instance into a parent (defaults to the original parent). Undoable.",
    inputSchema: { type: "object", properties: { path, parent: path, name: { type: "string" } }, required: ["path"] },
  },
  {
    name: "reparent_instances",
    mutating: true,
    description: "Move instances under a new parent. Undoable.",
    inputSchema: { type: "object", properties: { paths, parent: path }, required: ["paths", "parent"] },
  },
  {
    name: "list_scripts",
    description: "List every Script, LocalScript and ModuleScript under a root with line counts and run context.",
    inputSchema: { type: "object", properties: { root: { ...path, default: "game" } } },
  },
  {
    name: "read_script",
    description: "Read a script's current editor source (includes unsaved edits). Optional 1-based line range.",
    inputSchema: {
      type: "object",
      properties: { path, startLine: { type: "integer", minimum: 1 }, endLine: { type: "integer", minimum: 1 } },
      required: ["path"],
    },
  },
  {
    name: "edit_script",
    mutating: true,
    description: "Replace an exact text snippet in a script (like a code editor find/replace). Fails if the snippet is missing, or appears more than once without replaceAll. Undoable.",
    inputSchema: {
      type: "object",
      properties: { path, oldText: { type: "string", minLength: 1 }, newText: { type: "string" }, replaceAll: { type: "boolean", default: false } },
      required: ["path", "oldText", "newText"],
    },
  },
  {
    name: "write_script",
    mutating: true,
    description: "Overwrite a script's full source. Prefer edit_script for partial changes. Undoable.",
    inputSchema: { type: "object", properties: { path, source: { type: "string" } }, required: ["path", "source"] },
  },
  {
    name: "search_scripts",
    description: "Grep across all script sources. Returns path, line number and line text.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 1 },
        plain: { type: "boolean", default: true, description: "false = treat query as a Lua pattern." },
        caseSensitive: { type: "boolean", default: false, description: "Ignored for Lua patterns (always case-sensitive)." },
        root: { ...path, default: "game" },
        limit: { type: "integer", minimum: 1, maximum: 1000, default: 100 },
      },
      required: ["query"],
    },
  },
  {
    name: "get_selection",
    description: "Return the paths currently selected in Studio's Explorer.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "set_selection",
    description: "Select instances in Studio's Explorer (empty list clears the selection).",
    inputSchema: { type: "object", properties: { paths: { type: "array", items: { type: "string" } } }, required: ["paths"] },
  },
  {
    name: "set_attributes",
    mutating: true,
    description: "Set and/or remove attributes on instances as one undo step.",
    inputSchema: {
      type: "object",
      properties: { paths, attributes: valueMap, remove: { type: "array", items: { type: "string" } } },
      required: ["paths"],
    },
  },
  {
    name: "manage_tags",
    mutating: true,
    description: "Add and/or remove CollectionService tags on instances as one undo step.",
    inputSchema: {
      type: "object",
      properties: { paths, add: { type: "array", items: { type: "string" } }, remove: { type: "array", items: { type: "string" } } },
      required: ["paths"],
    },
  },
  {
    name: "undo",
    mutating: true,
    description: "Undo the last Studio change-history step(s) made by Claude. Stops (without undoing) at the first step the user made, unless force=true — only force after the user agrees.",
    inputSchema: {
      type: "object",
      properties: { steps: { type: "integer", minimum: 1, maximum: 50, default: 1 }, force: { type: "boolean", default: false } },
    },
  },
  {
    name: "redo",
    mutating: true,
    description: "Redo the last undone Studio change-history step(s).",
    inputSchema: { type: "object", properties: { steps: { type: "integer", minimum: 1, maximum: 50, default: 1 } } },
  },
  {
    name: "camera_get",
    description: "Read the Studio camera position, look vector and field of view.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "camera_set",
    description: "Place the Studio camera. Give position + lookAt, or target (an instance path) to frame it automatically.",
    inputSchema: {
      type: "object",
      properties: {
        position: keyframe.properties.position,
        lookAt: keyframe.properties.lookAt,
        target: { type: "string", description: "Instance path to frame." },
        distance: { type: "number", minimum: 0, description: "Framing distance multiplier when using target (default 1.5)." },
        fov: keyframe.properties.fov,
      },
    },
  },
  {
    name: "camera_path",
    description: "Fly the Studio camera smoothly through keyframes (for recording trailers/clips with your own screen recorder). Blocks until the move finishes. startDelay gives you time to start recording.",
    inputSchema: {
      type: "object",
      properties: {
        keyframes: { type: "array", items: keyframe, minItems: 2 },
        duration: { type: "number", minimum: 0.5, maximum: 120, default: 8 },
        startDelay: { type: "number", minimum: 0, maximum: 30, default: 3 },
        easing: { type: "string", enum: ["linear", "smooth"], default: "smooth" },
      },
      required: ["keyframes"],
    },
    timeoutMs: (args) => ((Number(args?.duration) || 8) + (Number(args?.startDelay) || 3) + 30) * 1000,
  },
  {
    name: "camera_orbit",
    description: "Orbit the Studio camera around an instance (BasePart, Model or Attachment) for a turntable shot. Starts from the camera's current bearing. Blocks until done.",
    inputSchema: {
      type: "object",
      properties: {
        target: { type: "string", description: "Instance path to orbit around." },
        radius: { type: "number", minimum: 1 },
        height: { type: "number", description: "Height above the target's center." },
        degrees: { type: "number", minimum: -1080, maximum: 1080, default: 360, description: "Negative = clockwise." },
        duration: { type: "number", minimum: 0.5, maximum: 120, default: 10 },
        startDelay: { type: "number", minimum: 0, maximum: 30, default: 3 },
        easing: { type: "string", enum: ["linear", "smooth"], default: "linear" },
        fov: { type: "number", minimum: 1, maximum: 120 },
      },
      required: ["target"],
    },
    timeoutMs: (args) => ((Number(args?.duration) || 10) + (Number(args?.startDelay) || 3) + 30) * 1000,
  },
  {
    name: "create_tree",
    mutating: true,
    description: "Build a whole instance hierarchy from a nested spec in one undo step (GUIs, models, folders of RemoteEvents...). Each node: {className, name?, properties?, attributes?, tags?, children?}. Max 2000 nodes; nothing is parented until every node succeeded.",
    inputSchema: {
      type: "object",
      properties: {
        parent: path,
        tree: { type: "object", description: "Root node spec.", properties: { className: { type: "string" } }, required: ["className"] },
      },
      required: ["parent", "tree"],
    },
  },
  {
    name: "insert_asset",
    mutating: true,
    description: "Insert an asset by ID with InsertService:LoadAsset. Its scripts are audited BEFORE insertion; assets with high-severity backdoor patterns are refused unless allowSuspicious. Lists every script it brings in. Undoable.",
    inputSchema: {
      type: "object",
      properties: {
        assetId: { type: "integer", minimum: 1 },
        parent: { ...path, default: "Workspace" },
        allowSuspicious: { type: "boolean", default: false, description: "Insert even if its scripts match high-severity backdoor patterns. Only with the user's explicit OK." },
      },
      required: ["assetId"],
    },
  },
  {
    name: "open_script",
    description: "Open a script in Studio's script editor at a line, so the user can see the code being discussed.",
    inputSchema: { type: "object", properties: { path, line: { type: "integer", minimum: 1 } }, required: ["path"] },
  },
  {
    name: "get_bounds",
    description: "World bounding box of parts/models/attachments: center, size, top/bottom Y. Use it to place things precisely.",
    inputSchema: { type: "object", properties: { paths }, required: ["paths"] },
  },
  {
    name: "raycast",
    description: "Cast a ray in Workspace (default: straight down 1000 studs) to find the ground or what is in front of something.",
    inputSchema: {
      type: "object",
      properties: {
        origin: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 },
        direction: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 },
        ignore: { type: "array", items: { type: "string" }, description: "Instance paths to exclude." },
      },
      required: ["origin"],
    },
  },
  {
    name: "audit_scripts",
    description: "Scan scripts for common backdoor/obfuscation signatures (require by asset ID, loadstring, getfenv, Discord webhooks, PostAsync, escaped byte strings, packed lines). Use after inserting free models or when a place behaves strangely. Findings are leads to review, not proof.",
    inputSchema: {
      type: "object",
      properties: {
        root: { ...path, default: "game" },
        minSeverity: { type: "string", enum: ["low", "medium", "high"], default: "low" },
      },
    },
  },
  {
    name: "terrain_fill",
    mutating: true,
    description: "Fill terrain with a block, ball or cylinder of a material (use material \"Air\" to carve/clear). Undoable.",
    inputSchema: {
      type: "object",
      properties: {
        shape: { type: "string", enum: ["block", "ball", "cylinder"] },
        material: { type: "string", description: "Enum.Material name, e.g. Grass, Rock, Water, Sand, Air." },
        position: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3 },
        size: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3, description: "block only" },
        radius: { type: "number", minimum: 0.5, description: "ball and cylinder" },
        height: { type: "number", minimum: 0.5, description: "cylinder only" },
        orientation: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 3, description: "Degrees, block and cylinder." },
      },
      required: ["shape", "material", "position"],
    },
  },
  {
    name: "analyze_remotes",
    description: "Map every RemoteEvent/RemoteFunction: which scripts fire it and which handle it (client vs server), and warn about server handlers with no visible argument checks, client-fired remotes with no server handler, and unused remotes. Heuristic (matches remote names in source).",
    inputSchema: { type: "object", properties: { root: { ...path, default: "game", description: "Only remotes under this path." } } },
  },
  {
    name: "snapshot",
    description: "Record the state of a subtree (classes, common properties, attributes, script source hashes) in Studio memory. Take one before a change, then diff_snapshot after it to see exactly what changed and catch regressions.",
    inputSchema: {
      type: "object",
      properties: { root: { ...path, default: "Workspace" }, name: { type: "string", description: "Snapshot name (re-using a name replaces it). Max 5 kept." } },
    },
  },
  {
    name: "diff_snapshot",
    description: "Compare a subtree with a snapshot: instances added, removed, and which properties/attributes/sources changed.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 2000, default: 200 } },
      required: ["name"],
    },
  },
  {
    name: "batch",
    description: "Run up to 50 tool calls as ONE undo step; if any step fails, everything is rolled back. Not allowed inside: batch, undo, redo, camera_path, camera_orbit.",
    inputSchema: {
      type: "object",
      properties: {
        steps: {
          type: "array",
          minItems: 1,
          maxItems: 50,
          items: { type: "object", properties: { tool: { type: "string" }, args: { type: "object" } }, required: ["tool"] },
        },
      },
      required: ["steps"],
    },
    timeoutMs: () => 120_000,
  },
  {
    name: "get_output",
    description: "Read Studio Output messages captured by the plugin (oldest first). Pass the returned nextSince as 'since' to page forward; more=true means call again.",
    inputSchema: {
      type: "object",
      properties: {
        since: { type: "integer", minimum: 0, default: 0, description: "Return messages after this seq (use nextSince from the previous call)." },
        types: { type: "array", items: { type: "string", enum: ["output", "info", "warning", "error"] } },
        limit: { type: "integer", minimum: 1, maximum: 500, default: 100 },
      },
    },
  },
  {
    name: "run_luau",
    mutating: true,
    description: "Run Luau in the edit DataModel with plugin permissions. Returns printed output and the chunk's return values (serialized). Changes are wrapped in one undo step.",
    inputSchema: { type: "object", properties: { code: { type: "string", minLength: 1 } }, required: ["code"] },
  },
];

export const BATCH_BLOCKED = new Set(["batch", "undo", "redo", "camera_path", "camera_orbit"]);

export const TOOL_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));
