# Roblox Studio Plus

Plugin para Claude Code que le da a Claude más control sobre Roblox Studio que el MCP oficial. Tiene tres partes:

| Parte | Archivo | Qué hace |
| --- | --- | --- |
| Servidor MCP | `server/index.mjs` | Expone las herramientas a Claude. Node ≥ 18, sin dependencias. |
| Plugin de Studio | `studio-plugin/RobloxStudioPlus.server.lua` | Recibe los comandos por `localhost` y los ejecuta en Studio. |
| Skill | `skills/roblox-studio-plus/SKILL.md` | Le enseña a Claude cuándo y cómo usar cada herramienta. |

## Qué añade respecto al MCP oficial

El MCP oficial de Roblox trae `run_code`, `insert_model`, `get_console_output`, `start_stop_play`, `run_script_in_play_mode` y `get_studio_mode`. Este plugin añade herramientas dedicadas en lugar de tener que escribir Luau para todo:

- **Explorar:** `get_tree` (marca nombres duplicados), `find_instances` (por clase, nombre, patrón, tag o atributo), `get_properties`
- **Editar con deshacer:** `set_properties`, `create_instance`, `clone_instance`, `reparent_instances`, `delete_instances`. Cada operación es un solo paso de Ctrl+Z y se revierte entera si algo falla.
- **Scripts:** `list_scripts`, `read_script` (con números de línea), `edit_script` (buscar y reemplazar exacto), `write_script`, `search_scripts` (grep en todos los scripts)
- **Atributos y tags:** `set_attributes`, `manage_tags`
- **Studio:** `get_selection`, `set_selection`, `undo`, `redo`, `get_output`
- **Cámara para trailers:** `camera_get`, `camera_set` (encuadra una instancia), `camera_path` (vuelo suave entre puntos clave, con cuenta atrás para empezar a grabar)
- **Comodín:** `run_luau` (devuelve los prints y los valores de retorno, y también se puede deshacer)

Los dos MCP pueden estar instalados a la vez (usan puertos distintos).

## Instalación

1. **En Claude Code:**
   ```
   /plugin marketplace add elpoletexx/system
   /plugin install roblox-studio-plus@elpoletexx-roblox
   ```
   Reinicia Claude Code para que arranque el servidor MCP.
2. **En Roblox Studio:** pestaña **Plugins** → **Plugins Folder**. Copia ahí `studio-plugin/RobloxStudioPlus.server.lua` y reinicia Studio.
3. En Studio: **Plugins** → **Studio Plus** → **Connect**. Studio te pedirá permiso para hacer peticiones HTTP a `localhost`: acéptalo. Si sigue sin conectar, activa **Game Settings → Security → Allow HTTP Requests**.
4. En Claude, pide algo como "comprueba la conexión con Studio". Claude llamará a `studio_status`.

El botón **Connect** queda recordado. Púlsalo otra vez para desconectar.

## Puerto

Se usa `44877` por defecto. Si necesitas cambiarlo, hazlo en los dos lados:
- en el servidor, con la variable de entorno `ROBLOX_STUDIO_PLUS_PORT`
- en el plugin, con la constante `PORT` al principio de `RobloxStudioPlus.server.lua`

Solo una sesión de Claude a la vez puede usar el puerto.

## Seguridad

- El servidor solo escucha en `127.0.0.1`. Rechaza peticiones que vengan de navegadores (cabecera `Origin`) y con `Host` que no sea local, para evitar ataques de DNS rebinding.
- No hace nada hasta que pulsas **Connect** en Studio.
- `delete_instances` no deja borrar servicios, Terrain ni la cámara.
- Todos los argumentos se validan dos veces: en el servidor y otra vez en Studio.

## Tests

```
npm test
```

Los tests prueban el servidor MCP y el puente HTTP con un Studio simulado. El plugin Luau se comprueba con `luau-compile`. Las funciones que usan la API de Roblox solo se pueden probar dentro de Studio (ver "Pruebas manuales" en el PR).
