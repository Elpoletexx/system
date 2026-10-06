# Roblox Studio Plus

Plugin para Claude Code que le da a Claude más control sobre Roblox Studio que el MCP oficial. Tiene tres partes:

| Parte | Archivo | Qué hace |
| --- | --- | --- |
| Servidor MCP | `server/index.mjs` | Expone las herramientas a Claude. Node ≥ 18, sin dependencias. |
| Plugin de Studio | `studio-plugin/RobloxStudioPlus.server.lua` | Recibe los comandos por `localhost` y los ejecuta en Studio. |
| Skill | `skills/roblox-studio-plus/SKILL.md` | Le enseña a Claude cuándo y cómo usar cada herramienta. |

## Qué añade respecto al MCP oficial

El MCP oficial de Roblox trae `run_code`, `insert_model`, `get_console_output`, `start_stop_play`, `run_script_in_play_mode` y `get_studio_mode`. Este plugin añade herramientas dedicadas en lugar de tener que escribir Luau para todo:

- **Explorar:** `get_tree` (con propiedades opcionales por nodo), `find_instances` (por clase, nombre, patrón, tag o atributo), `get_properties`, `get_bounds`, `raycast`
- **Nombres repetidos:** si dos hermanos se llaman igual, sus rutas llevan índice (`Workspace.Map.Tree[2]`), así cada uno se puede seleccionar sin ambigüedad.
- **Editar con deshacer:** `set_properties`, `create_instance`, `create_tree` (una jerarquía entera de una vez: GUIs, modelos, carpetas de RemoteEvents), `insert_asset` (por ID), `clone_instance`, `reparent_instances`, `delete_instances`. Cada operación es un solo paso de Ctrl+Z y se revierte entera si algo falla.
- **Scripts:** `open_script` (lo abre en el editor en una línea), `list_scripts`, `read_script` (con números de línea), `edit_script` (buscar y reemplazar exacto), `write_script`, `search_scripts` (grep en todos los scripts)
- **Atributos y tags:** `set_attributes`, `manage_tags`
- **Studio:** `get_selection`, `set_selection`, `undo`, `redo`, `get_output`
- **Cámara para trailers:** `camera_get`, `camera_set` (encuadra una instancia), `camera_orbit` (gira alrededor de un modelo), `camera_path` (vuelo suave entre puntos clave, con cuenta atrás para empezar a grabar)
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

## Actualizar

Al actualizar el plugin de Claude Code, copia también el `RobloxStudioPlus.server.lua` nuevo en la carpeta de Plugins de Studio. Si las versiones no coinciden, `studio_status` lo avisa.

## Tests

```
npm test
```

Los tests prueban el servidor MCP y el puente HTTP con un Studio simulado, y comprueban que cada herramienta tiene su función en el plugin de Studio. Si tienes `luau` instalado (o defines `LUAU_BIN`), también compilan el plugin y prueban la lógica de rutas con instancias simuladas. Las funciones que usan la API de Roblox solo se pueden probar dentro de Studio:

## Pruebas manuales en Studio

En un place de prueba, con el plugin conectado:

1. `studio_status`: debe devolver el nombre del place y la misma versión que el servidor.
2. `get_tree` de `Workspace` con profundidad 2.
3. `set_properties` para cambiar el color de una Part; luego Ctrl+Z en Studio debe deshacerlo en un solo paso.
4. `create_tree` con una ScreenGui > Frame > TextButton; Ctrl+Z debe quitar todo junto.
5. `edit_script` en un script de prueba, y `open_script` para verlo en el editor.
6. `run_luau` con `print(1) return workspace`: debe devolver la salida `1` y la ruta de Workspace.
7. `camera_orbit` alrededor de un modelo y `camera_path` con 3 puntos: comprueba que el movimiento es suave y que el ratón no lo interrumpe.
