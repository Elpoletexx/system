# Órbita

Un juego casual para iPhone que se aprende con un toque. Tu punto gira sin parar alrededor de dos órbitas: **toca la pantalla para saltar de órbita**, esquiva los arcos rojos y atrapa las gemas doradas. Cada segundo gira un poco más rápido.

- Una sola mecánica, partidas de 10 a 60 segundos y "una más" al instante.
- Separación justa: los obstáculos siempre dejan una salida, y el hueco crece con la velocidad.
- Vibración háptica, 120 Hz en pantallas ProMotion, récord guardado y botón "Retar a un amigo".
- Sin anuncios, sin rastreo y sin red. El manifiesto de privacidad ya está incluido.

## Estructura

```
App/                    App SwiftUI (pantallas, dibujo, vibración, bucle de frames)
Packages/OrbitaCore/    Lógica pura del juego + tests (no depende de UIKit)
tools/make_icon.py      Genera el icono 1024×1024 de la App Store
project.yml             Definición del proyecto para XcodeGen
```

## Compilar y probar (en una Mac)

Requisitos: Xcode 15 o superior y [XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
brew install xcodegen
xcodegen generate          # crea Orbita.xcodeproj
open Orbita.xcodeproj
```

En Xcode: target **Orbita** → *Signing & Capabilities* → elige tu **Team** y cambia el Bundle ID `com.example.orbita` por uno tuyo (también puedes cambiarlo en `project.yml`). Después pulsa ▶︎ con un iPhone o un simulador.

Tests de la lógica:

```bash
cd Packages/OrbitaCore && swift test
```

## Publicar en la App Store

1. Inscríbete en el [Apple Developer Program](https://developer.apple.com/programs/) (99 USD al año).
2. En [App Store Connect](https://appstoreconnect.apple.com) → *Apps* → **+** → nueva app con tu Bundle ID.
3. En Xcode: *Product → Archive* → *Distribute App* → *App Store Connect*.
4. Completa la ficha:
   - **Categoría:** Juegos → Casual (y Arcade como secundaria).
   - **Privacidad:** "No se recopilan datos".
   - **Clasificación por edad:** 4+.
   - **Capturas:** iPhone 6.9" (1320×2868). Sácalas en el simulador con ⌘S.
5. Envía la app a revisión.

### Ficha sugerida

- **Nombre:** Órbita: Un Toque
- **Subtítulo:** Esquiva, gira y bate tu récord
- **Palabras clave:** juego,casual,arcade,un toque,reflejos,órbita,récord,adictivo,offline,minimalista
- **Descripción:** *¿Cuánto aguantas en órbita? Toca para saltar entre dos anillos, esquiva los obstáculos y atrapa gemas. Fácil de aprender, imposible de dejar. Sin anuncios, sin conexión: solo tú contra tu récord.*

## Ideas para crecer (siguientes versiones)

- Ranking y logros de **Game Center**: lo que más ayuda a que se vuelva viral.
- Sonido y música (hoy solo tiene vibración).
- Pieles para el punto y los anillos, desbloqueables con gemas o con una compra "Pro" única.
- Reto diario con la misma semilla para todos (el motor ya acepta `seed`).
- Traducción al inglés: hoy los textos están en español.
