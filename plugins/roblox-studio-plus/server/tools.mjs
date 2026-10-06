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
    description: "Check the bridge connection and report the open place, Studio mode and selection count. Call this first.",
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
    description: "Search descendants by class (IsA), exact name, Lua name pattern, CollectionService tag or attribute name. Returns paths.",
    inputSchema: {
      type: "object",
      properties: {
        root: { ...path, default: "game" },
        className: { type: "string", description: "Matches with IsA, so 'BasePart' finds Parts, MeshParts, etc." },
        name: { type: "string" },
        namePattern: { type: "string", description: "Lua string pattern matched against Name." },
        tag: { type: "string" },
        attribute: { type: "string", description: "Only instances that have this attribute set." },
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
    description: "Set properties on one or more instances as a single undo step. If any assignment fails, the whole step is rolled back.",
    inputSchema: { type: "object", properties: { paths, properties: valueMap }, required: ["paths", "properties"] },
  },
  {
    name: "create_instance",
    description: "Create an instance (properties are applied before parenting). Undoable.",
    inputSchema: {
      type: "object",
      properties: { className: { type: "string" }, parent: path, name: { type: "string" }, properties: valueMap },
      required: ["className", "parent"],
    },
  },
  {
    name: "delete_instances",
    description: "Destroy instances as a single undo step. Services, the DataModel, Terrain and the current camera are refused.",
    inputSchema: { type: "object", properties: { paths }, required: ["paths"] },
  },
  {
    name: "clone_instance",
    description: "Clone an instance into a parent (defaults to the original parent). Undoable.",
    inputSchema: { type: "object", properties: { path, parent: path, name: { type: "string" } }, required: ["path"] },
  },
  {
    name: "reparent_instances",
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
    description: "Replace an exact text snippet in a script (like a code editor find/replace). Fails if the snippet is missing, or appears more than once without replaceAll. Undoable.",
    inputSchema: {
      type: "object",
      properties: { path, oldText: { type: "string", minLength: 1 }, newText: { type: "string" }, replaceAll: { type: "boolean", default: false } },
      required: ["path", "oldText", "newText"],
    },
  },
  {
    name: "write_script",
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
        caseSensitive: { type: "boolean", default: false },
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
    description: "Set and/or remove attributes on instances as one undo step.",
    inputSchema: {
      type: "object",
      properties: { paths, attributes: valueMap, remove: { type: "array", items: { type: "string" } } },
      required: ["paths"],
    },
  },
  {
    name: "manage_tags",
    description: "Add and/or remove CollectionService tags on instances as one undo step.",
    inputSchema: {
      type: "object",
      properties: { paths, add: { type: "array", items: { type: "string" } }, remove: { type: "array", items: { type: "string" } } },
      required: ["paths"],
    },
  },
  {
    name: "undo",
    description: "Undo the last Studio change-history step(s).",
    inputSchema: { type: "object", properties: { steps: { type: "integer", minimum: 1, maximum: 50, default: 1 } } },
  },
  {
    name: "redo",
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
    description: "Insert an asset by ID with InsertService:LoadAsset (assets you or Roblox own, or free Creator Store assets). Undoable. Use the official MCP's insert_model to search by name instead.",
    inputSchema: {
      type: "object",
      properties: { assetId: { type: "integer", minimum: 1 }, parent: { ...path, default: "Workspace" } },
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
    name: "get_output",
    description: "Read Studio Output messages captured by the plugin. Pass 'since' (the last seq you saw) to get only new lines.",
    inputSchema: {
      type: "object",
      properties: {
        since: { type: "integer", minimum: 0, default: 0 },
        types: { type: "array", items: { type: "string", enum: ["output", "info", "warning", "error"] } },
        limit: { type: "integer", minimum: 1, maximum: 500, default: 100 },
      },
    },
  },
  {
    name: "run_luau",
    description: "Run Luau in the edit DataModel with plugin permissions. Returns printed output and the chunk's return values (serialized). Changes are wrapped in one undo step.",
    inputSchema: { type: "object", properties: { code: { type: "string", minLength: 1 } }, required: ["code"] },
  },
];

export const TOOL_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));
