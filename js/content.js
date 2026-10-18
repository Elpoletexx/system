/*
  All portfolio content lives here, in three languages (ca / es / en).
  Edit this file to change text, add projects or update release dates.
  Layout and styling live in css/styles.css; rendering lives in js/main.js.
*/
window.PORTFOLIO = {
  handle: "PLVZ03",

  /*
    Contact methods. The first entry is shown large as the main way to reach you.
    Leave href out for copy-only entries.
    Roblox: add href: "https://www.roblox.com/users/<your user id>/profile" once you have the ID.
  */
  contact: [
    { label: "Email", value: "zpstudios@protonmail.com", href: "mailto:zpstudios@protonmail.com?subject=Roblox%20commission" },
    { label: "Discord", value: "poletess_40567" },
    { label: "Roblox", value: "PoletessXZaareet" }
  ],

  // Projects shown under the hero headline: id (project or client job) and focus (CSS object-position).
  heroWork: [
    { id: "tce", focus: "50% 40%" },
    { id: "murder-after-dark", focus: "0% 50%" },
    { id: "sunset-party-club", focus: "50% 50%" }
  ],

  stack: [
    "Roblox Studio",
    "Luau",
    "Client/Server",
    "Roblox Networking",
    "Data Persistence",
    "Roblox UI",
    "Roblox Audio"
  ],

  ui: {
    en: {
      "nav.projects": "Projects",
      "nav.about": "About",
      "nav.rates": "Rates",
      "nav.contact": "Contact",
      "label.skip": "Skip to projects",
      "hero.role": "Roblox systems developer · Luau",
      "hero.title": "I build Roblox games from the server out.",
      "hero.lede": "I write Luau with the server as the authority: rounds and roles, combat and artillery, player building, economies and anti-cheat. Right now I am Lead Gameplay / Systems Developer on TCE: The Continental Era.",
      "hero.ctaPrimary": "Get a quote",
      "hero.ctaSecondary": "See projects",
      "hero.status": "Open for commissions",
      "projects.title": "Projects",
      "projects.intro": "Client work, plus my own games and systems. Release dates are current estimates.",
      "projects.index": ["Project", "Type", "Years", "Status"],
      "projects.more": "More projects",
      "status.active": "Active",
      "label.role": "Role",
      "label.developer": "Developer",
      "label.period": "Period",
      "label.more": "Full breakdown",
      "label.enlarge": "Enlarge image",
      "label.close": "Close",
      "experience.title": "Client work",
      "experience.systems": "Systems I worked on",
      "experience.bugs": "Bugs traced to the root",
      "experience.bugsIntro": "Many of these could not be fixed in the script where the symptom appeared. Each one meant following state across several systems until the real source turned up.",
      "experience.symptom": "Symptom",
      "experience.cause": "Cause",
      "experience.process": "Before changing inherited code",
      "experience.processOutro": "The goal is to fix the actual root cause with as few rewrites as possible.",
      "about.title": "About",
      "about.text": "Since 2023 I have designed and built Roblox games end to end: core frameworks, gameplay, UI, data, monetization and security. I work on my own titles and on client projects, including large inherited codebases.",
      "skills.title": "What I work on",
      "skills.stackLabel": "Tools",
      "skills.items": [
        ["Gameplay systems", "Rounds, roles, combat, progression, pets, building and NPCs."],
        ["Frameworks & architecture", "Modular services shared across places, built to keep growing."],
        ["Security & anti-cheat", "Server validation, remote checks and exploit detection."],
        ["UI/UX & mobile", "Menus, shops, inventories and HUDs for PC, tablet and phone."],
        ["Economy & monetization", "Currencies, rewards, cosmetics, gamepasses and developer products."],
        ["Testing & debugging", "Automated tests, edge cases and root-cause fixes in inherited code."]
      ],
      "rates.title": "Rates",
      "rates.intro": "Approximate prices. Final price depends on the size of the task.",
      "rates.perTask": "Per task",
      "rates.via": "via",
      "rates.crypto": "Also in crypto:",
      "rates.longTerm": "Long-term",
      "rates.plan": "Plan",
      "rates.hours": "Hours / week",
      "rates.monthly": "Per month",
      "rates.hoursUnit": "h / week",
      "contact.title": "A system, a full game or long-term help: tell me what you need.",
      "contact.text": "I answer in Catalan, Spanish or English.",
      "footer.copy": "Copy",
      "footer.copied": "Copied",
      "footer.built": "Roblox developer portfolio",
      "footer.top": "Top"
    },
    es: {
      "nav.projects": "Proyectos",
      "nav.about": "Sobre mí",
      "nav.rates": "Tarifas",
      "nav.contact": "Contacto",
      "label.skip": "Saltar a los proyectos",
      "hero.role": "Desarrollador de sistemas en Roblox · Luau",
      "hero.title": "Construyo juegos de Roblox empezando por el servidor.",
      "hero.lede": "Programo en Luau con el servidor como autoridad: rondas y roles, combate y artillería, construcción, economías y anticheat. Ahora mismo soy Lead Gameplay / Systems Developer en TCE: The Continental Era.",
      "hero.ctaPrimary": "Pide presupuesto",
      "hero.ctaSecondary": "Ver proyectos",
      "hero.status": "Disponible para encargos",
      "projects.title": "Proyectos",
      "projects.intro": "Trabajo para clientes y juegos y sistemas propios. Las fechas de lanzamiento son estimaciones actuales.",
      "projects.index": ["Proyecto", "Tipo", "Años", "Estado"],
      "projects.more": "Más proyectos",
      "status.active": "En curso",
      "label.role": "Rol",
      "label.developer": "Desarrollador",
      "label.period": "Periodo",
      "label.more": "Desglose completo",
      "label.enlarge": "Ampliar imagen",
      "label.close": "Cerrar",
      "experience.title": "Trabajo para clientes",
      "experience.systems": "Sistemas en los que he trabajado",
      "experience.bugs": "Bugs rastreados hasta la raíz",
      "experience.bugsIntro": "Muchos no se podían arreglar en el script donde aparecía el síntoma. Cada uno obligó a seguir el estado a través de varios sistemas hasta dar con el origen real.",
      "experience.symptom": "Síntoma",
      "experience.cause": "Causa",
      "experience.process": "Antes de tocar código heredado",
      "experience.processOutro": "El objetivo es arreglar la causa real con el menor número de reescrituras posible.",
      "about.title": "Sobre mí",
      "about.text": "Desde 2023 diseño y construyo juegos de Roblox de principio a fin: frameworks, gameplay, UI, datos, monetización y seguridad. Trabajo en mis propios juegos y en proyectos de clientes, incluidas bases de código heredadas de gran tamaño.",
      "skills.title": "En qué trabajo",
      "skills.stackLabel": "Herramientas",
      "skills.items": [
        ["Sistemas de juego", "Rondas, roles, combate, progresión, mascotas, construcción y NPCs."],
        ["Frameworks y arquitectura", "Servicios modulares compartidos entre places, pensados para crecer."],
        ["Seguridad y anticheat", "Validación en servidor, control de remotes y detección de exploits."],
        ["UI/UX y móvil", "Menús, tiendas, inventarios y HUDs para PC, tablet y móvil."],
        ["Economía y monetización", "Monedas, recompensas, cosméticos, gamepasses y developer products."],
        ["Testing y depuración", "Tests automáticos, casos límite y correcciones de la causa real en código heredado."]
      ],
      "rates.title": "Tarifas",
      "rates.intro": "Precios aproximados. El precio final depende del tamaño de la tarea.",
      "rates.perTask": "Por tarea",
      "rates.via": "por",
      "rates.crypto": "También en cripto:",
      "rates.longTerm": "A largo plazo",
      "rates.plan": "Plan",
      "rates.hours": "Horas / semana",
      "rates.monthly": "Al mes",
      "rates.hoursUnit": "h / semana",
      "contact.title": "Un sistema, un juego completo o ayuda a largo plazo: cuéntame qué necesitas.",
      "contact.text": "Respondo en catalán, castellano o inglés.",
      "footer.copy": "Copiar",
      "footer.copied": "Copiado",
      "footer.built": "Portfolio de desarrollador de Roblox",
      "footer.top": "Arriba"
    },
    ca: {
      "nav.projects": "Projectes",
      "nav.about": "Sobre mi",
      "nav.rates": "Tarifes",
      "nav.contact": "Contacte",
      "label.skip": "Vés als projectes",
      "hero.role": "Desenvolupador de sistemes a Roblox · Luau",
      "hero.title": "Construeixo jocs de Roblox començant pel servidor.",
      "hero.lede": "Programo en Luau amb el servidor com a autoritat: rondes i rols, combat i artilleria, construcció, economies i anticheat. Ara mateix soc Lead Gameplay / Systems Developer a TCE: The Continental Era.",
      "hero.ctaPrimary": "Demana pressupost",
      "hero.ctaSecondary": "Mira els projectes",
      "hero.status": "Disponible per a encàrrecs",
      "projects.title": "Projectes",
      "projects.intro": "Feina per a clients i jocs i sistemes propis. Les dates de llançament són estimacions actuals.",
      "projects.index": ["Projecte", "Tipus", "Anys", "Estat"],
      "projects.more": "Més projectes",
      "status.active": "En curs",
      "label.role": "Rol",
      "label.developer": "Desenvolupador",
      "label.period": "Període",
      "label.more": "Desglossament complet",
      "label.enlarge": "Amplia la imatge",
      "label.close": "Tanca",
      "experience.title": "Feina per a clients",
      "experience.systems": "Sistemes en què he treballat",
      "experience.bugs": "Bugs rastrejats fins a l'arrel",
      "experience.bugsIntro": "Molts no es podien arreglar a l'script on apareixia el símptoma. Cadascun va obligar a seguir l'estat a través de diversos sistemes fins a trobar l'origen real.",
      "experience.symptom": "Símptoma",
      "experience.cause": "Causa",
      "experience.process": "Abans de tocar codi heretat",
      "experience.processOutro": "L'objectiu és arreglar la causa real amb el mínim de reescriptures possible.",
      "about.title": "Sobre mi",
      "about.text": "Des del 2023 dissenyo i construeixo jocs de Roblox de principi a fi: frameworks, gameplay, UI, dades, monetització i seguretat. Treballo en els meus propis jocs i en projectes de clients, incloses bases de codi heretades de grans dimensions.",
      "skills.title": "En què treballo",
      "skills.stackLabel": "Eines",
      "skills.items": [
        ["Sistemes de joc", "Rondes, rols, combat, progressió, mascotes, construcció i NPCs."],
        ["Frameworks i arquitectura", "Serveis modulars compartits entre places, pensats per créixer."],
        ["Seguretat i anticheat", "Validació al servidor, control de remotes i detecció d'exploits."],
        ["UI/UX i mòbil", "Menús, botigues, inventaris i HUDs per a PC, tauleta i mòbil."],
        ["Economia i monetització", "Monedes, recompenses, cosmètics, gamepasses i developer products."],
        ["Testing i depuració", "Tests automàtics, casos límit i correccions de la causa real en codi heretat."]
      ],
      "rates.title": "Tarifes",
      "rates.intro": "Preus aproximats. El preu final depèn de la mida de la tasca.",
      "rates.perTask": "Per tasca",
      "rates.via": "per",
      "rates.crypto": "També en cripto:",
      "rates.longTerm": "A llarg termini",
      "rates.plan": "Pla",
      "rates.hours": "Hores / setmana",
      "rates.monthly": "Al mes",
      "rates.hoursUnit": "h / setmana",
      "contact.title": "Un sistema, un joc complet o ajuda a llarg termini: explica'm què necessites.",
      "contact.text": "Responc en català, castellà o anglès.",
      "footer.copy": "Copia",
      "footer.copied": "Copiat",
      "footer.built": "Portfolio de desenvolupador de Roblox",
      "footer.top": "Amunt"
    }
  },

  /*
    tone: status dot, "dev" (in development), "live", "private" or "old" (archived).
    color: the project's own accent, taken from its artwork.
    genre: short type shown in the project index and under hero thumbnails.
    layout: "compact" shows the project as a smaller card under "More projects".
    releaseBy: "YYYY-MM". After that month ends, the release date is hidden from the status automatically.
    Detail items can be a plain string or ["Name", "description"].
  */
  projects: [
    {
      id: "murder-after-dark",
      color: "#d9b46c",
      years: "2026 –",
      tone: "dev",
      releaseBy: "2026-12",
      images: [{ src: "assets/img/murder-after-dark.jpg", w: 1200, h: 675 }],
      en: {
        title: "Murder After Dark",
        genre: "Murder mystery",
        status: "In development · release planned late Nov – Dec 2026",
        role: "Founder · Lead Programmer · Gameplay & Systems",
        alt: "Murder After Dark main menu with Play, Inventory, Shop, Cases, Settings and Private Servers buttons",
        tags: ["Social deduction", "Multiplayer", "4 game modes", "Custom framework"],
        summary: "A multiplayer murder mystery built around social deduction, fast rounds, progression and several game modes. I designed and built most of the technical side: the core framework, round systems, gameplay logic, networking, UI integration, data and security.",
        highlights: [
          "Four roles: Innocent, Sheriff, Murderer and Hero",
          "Role assignment, rounds, map voting, timers and round recovery",
          "Edge cases covered: leavers mid-round, resets, late joins, failed map loads, vote ties",
          "ZPFramework: one shared codebase across several places, dozens of services",
          "Large automated test suite for gameplay systems and edge cases",
          "Server-authoritative combat, round state, rewards and progression"
        ],
        details: [
          { title: "Game modes", items: [
            ["Classic", "The main social deduction mode."],
            ["Sheriffs vs Killers", "Team-based combat with guns and knives."],
            ["Free For All", "A faster combat mode where everyone fights alone."],
            ["The Strangers", "Survival horror: one to three Strangers hunt the rest. Survivors get time to hide, limited weapons and ammo, escape objectives, melee stun weapons, cinematics and custom endings."]
          ]},
          { title: "Maps", items: ["Grand Nocturne Hotel", "Midnight Express", "Ocean Crown", "Goal: a larger rotating map pool so rounds feel less repetitive"] },
          { title: "UI / UX", items: ["Main menu and play flow", "Inventory, shop and settings", "Private servers and spectating", "Round HUD, map voting and role info", "Progression and cosmetic screens", "Full redesign in progress under one consistent design system"] },
          { title: "Cosmetics & monetization", items: ["Knife and gun skins, cases and gems", "Emotes, victory and kill animations", "Custom gun and knife effects", "Inventory expansion and profile customization", "Optional gamepasses: the core game never depends on purchases"] }
        ]
      },
      es: {
        title: "Murder After Dark",
        genre: "Murder mystery",
        status: "En desarrollo · lanzamiento previsto entre finales de noviembre y diciembre de 2026",
        role: "Fundador · Programador principal · Gameplay y sistemas",
        alt: "Menú principal de Murder After Dark con los botones Play, Inventory, Shop, Cases, Settings y Private Servers",
        tags: ["Deducción social", "Multijugador", "4 modos de juego", "Framework propio"],
        summary: "Un murder mystery multijugador basado en la deducción social, rondas rápidas, progresión y varios modos de juego. He diseñado y construido casi toda la parte técnica: el framework, los sistemas de rondas, la lógica de juego, el networking, la integración de UI, los datos y la seguridad.",
        highlights: [
          "Cuatro roles: Inocente, Sheriff, Asesino y Héroe",
          "Asignación de roles, rondas, votación de mapas, temporizadores y recuperación de rondas",
          "Casos límite resueltos: jugadores que salen a mitad de ronda, resets, entradas tardías, mapas que fallan al cargar, empates en votaciones",
          "ZPFramework: un único código compartido entre varios places, con decenas de servicios",
          "Gran batería de tests automáticos para los sistemas de juego y los casos límite",
          "Combate, estado de ronda, recompensas y progresión con autoridad del servidor"
        ],
        details: [
          { title: "Modos de juego", items: [
            ["Classic", "El modo principal de deducción social."],
            ["Sheriffs vs Killers", "Combate por equipos con pistolas y cuchillos."],
            ["Free For All", "Un modo de combate más rápido, todos contra todos."],
            ["The Strangers", "Survival horror: de uno a tres Strangers cazan al resto. Los supervivientes tienen tiempo para esconderse, armas y munición limitadas, objetivos de escape, armas cuerpo a cuerpo que aturden, cinemáticas y finales propios."]
          ]},
          { title: "Mapas", items: ["Grand Nocturne Hotel", "Midnight Express", "Ocean Crown", "Objetivo: una rotación de mapas más amplia para que las rondas no se repitan"] },
          { title: "UI / UX", items: ["Menú principal y flujo de juego", "Inventario, tienda y ajustes", "Servidores privados y modo espectador", "HUD de ronda, votación de mapas e información de rol", "Pantallas de progresión y cosméticos", "Rediseño completo en curso con un sistema de diseño unificado"] },
          { title: "Cosméticos y monetización", items: ["Skins de cuchillo y pistola, cajas y gemas", "Emotes, animaciones de victoria y de eliminación", "Efectos personalizados para pistolas y cuchillos", "Ampliación de inventario y personalización de perfil", "Gamepasses opcionales: el juego principal nunca depende de comprar"] }
        ]
      },
      ca: {
        title: "Murder After Dark",
        genre: "Murder mystery",
        status: "En desenvolupament · llançament previst entre finals de novembre i desembre del 2026",
        role: "Fundador · Programador principal · Gameplay i sistemes",
        alt: "Menú principal de Murder After Dark amb els botons Play, Inventory, Shop, Cases, Settings i Private Servers",
        tags: ["Deducció social", "Multijugador", "4 modes de joc", "Framework propi"],
        summary: "Un murder mystery multijugador basat en la deducció social, rondes ràpides, progressió i diversos modes de joc. He dissenyat i construït gairebé tota la part tècnica: el framework, els sistemes de rondes, la lògica de joc, el networking, la integració de la UI, les dades i la seguretat.",
        highlights: [
          "Quatre rols: Innocent, Sheriff, Assassí i Heroi",
          "Assignació de rols, rondes, votació de mapes, temporitzadors i recuperació de rondes",
          "Casos límit resolts: jugadors que surten a mitja ronda, resets, entrades tardanes, mapes que fallen en carregar, empats en votacions",
          "ZPFramework: un sol codi compartit entre diversos places, amb desenes de serveis",
          "Gran bateria de tests automàtics per als sistemes de joc i els casos límit",
          "Combat, estat de ronda, recompenses i progressió amb autoritat del servidor"
        ],
        details: [
          { title: "Modes de joc", items: [
            ["Classic", "El mode principal de deducció social."],
            ["Sheriffs vs Killers", "Combat per equips amb pistoles i ganivets."],
            ["Free For All", "Un mode de combat més ràpid, tots contra tots."],
            ["The Strangers", "Survival horror: d'un a tres Strangers cacen la resta. Els supervivents tenen temps per amagar-se, armes i munició limitades, objectius de fuga, armes cos a cos que atordeixen, cinemàtiques i finals propis."]
          ]},
          { title: "Mapes", items: ["Grand Nocturne Hotel", "Midnight Express", "Ocean Crown", "Objectiu: una rotació de mapes més àmplia perquè les rondes no es repeteixin"] },
          { title: "UI / UX", items: ["Menú principal i flux de joc", "Inventari, botiga i opcions", "Servidors privats i mode espectador", "HUD de ronda, votació de mapes i informació de rol", "Pantalles de progressió i cosmètics", "Redisseny complet en curs amb un sistema de disseny unificat"] },
          { title: "Cosmètics i monetització", items: ["Skins de ganivet i pistola, caixes i gemmes", "Emotes, animacions de victòria i d'eliminació", "Efectes personalitzats per a pistoles i ganivets", "Ampliació d'inventari i personalització de perfil", "Gamepasses opcionals: el joc principal mai no depèn de comprar"] }
        ]
      }
    },

    {
      id: "sunset-party-club",
      color: "#ff5fd2",
      years: "2023 – 2026",
      tone: "dev",
      developer: "ZPSTUDIOS",
      images: [
        { src: "assets/img/sunset-party-club.jpg", w: 1200, h: 675 },
        { src: "assets/img/sunset-party-club-collage.jpg", w: 596, h: 340 }
      ],
      en: {
        title: "Sunset Party Club",
        genre: "Social nightlife",
        status: "Revamp in progress · 2026",
        role: "Gameplay, UI, audio and progression systems",
        alt: "The Sunset Party Club stage at night with green and purple spotlights and the DJ panel open",
        altExtra: "Collage of seven Sunset Party Club areas lit with neon",
        tags: ["Social", "Nightlife", "Audio-reactive", "Mobile"],
        summary: "A social nightlife experience built around music, social interaction, customization and progression. It brings many gameplay, UI, audio and social systems together in one club. The 2026 revamp overhauls every system, with new lighting and sound and a smoother interface.",
        highlights: [
          "DJ and AudioAnalyzer systems with beat and drop detection",
          "Music-reactive lighting, lasers and particles",
          "Beverage system with NPC vendors and drink effects",
          "NPC behaviours: vendors, idle, dancing and context-based activity",
          "Currencies, daily rewards, missions, achievements and badges",
          "VIP, cosmetics and gamepass integration"
        ],
        details: [
          { title: "Music", items: ["Custom DJ and music management", "Beat and drop detection", "Music-synced visual effects", "Dynamic lighting, lasers and particles"] },
          { title: "Interfaces", items: ["Main menus and settings", "Inventory, shop and themes", "Commands, missions and rewards", "Social interfaces and gameplay HUDs"] },
          { title: "Mobile support", items: ["Responsive, touch-friendly interfaces", "UI scaling and scrolling improvements", "Hotbar compatibility and mobile navigation", "Tested on PC, tablet and phone"] },
          { title: "Architecture", items: ["Modular approach with reusable systems", "Custom framework components", "Systems maintained and expanded independently", "Data persistence and client/server split"] }
        ]
      },
      es: {
        title: "Sunset Party Club",
        genre: "Vida nocturna social",
        status: "Revamp en curso · 2026",
        role: "Sistemas de juego, UI, audio y progresión",
        alt: "El escenario de Sunset Party Club de noche con focos verdes y morados y el panel de DJ abierto",
        altExtra: "Collage de siete zonas de Sunset Party Club iluminadas con neón",
        tags: ["Social", "Vida nocturna", "Reactivo al audio", "Móvil"],
        summary: "Una experiencia social de vida nocturna centrada en la música, la interacción, la personalización y la progresión. Reúne muchos sistemas de juego, UI, audio y sociales en un mismo club. El revamp de 2026 renueva todos los sistemas, con nueva iluminación y sonido y una interfaz más fluida.",
        highlights: [
          "Sistemas de DJ y AudioAnalyzer con detección de beats y drops",
          "Luces, láseres y partículas que reaccionan a la música",
          "Sistema de bebidas con vendedores NPC y efectos",
          "Comportamientos de NPCs: vendedores, idle, baile y actividad según el contexto",
          "Monedas, recompensas diarias, misiones, logros y badges",
          "VIP, cosméticos e integración de gamepasses"
        ],
        details: [
          { title: "Música", items: ["DJ propio y gestión de música", "Detección de beats y drops", "Efectos visuales sincronizados con la música", "Iluminación dinámica, láseres y partículas"] },
          { title: "Interfaces", items: ["Menús principales y ajustes", "Inventario, tienda y temas", "Comandos, misiones y recompensas", "Interfaces sociales y HUDs de juego"] },
          { title: "Soporte móvil", items: ["Interfaces adaptables y táctiles", "Escalado de UI y mejoras de scroll", "Compatibilidad con la hotbar y navegación móvil", "Probado en PC, tablet y móvil"] },
          { title: "Arquitectura", items: ["Enfoque modular con sistemas reutilizables", "Componentes de framework propios", "Sistemas que se mantienen y amplían por separado", "Persistencia de datos y separación cliente/servidor"] }
        ]
      },
      ca: {
        title: "Sunset Party Club",
        genre: "Vida nocturna social",
        status: "Revamp en curs · 2026",
        role: "Sistemes de joc, UI, àudio i progressió",
        alt: "L'escenari de Sunset Party Club de nit amb focus verds i morats i el panell de DJ obert",
        altExtra: "Collage de set zones de Sunset Party Club il·luminades amb neó",
        tags: ["Social", "Vida nocturna", "Reactiu a l'àudio", "Mòbil"],
        summary: "Una experiència social de vida nocturna centrada en la música, la interacció, la personalització i la progressió. Reuneix molts sistemes de joc, UI, àudio i socials en un mateix club. El revamp del 2026 renova tots els sistemes, amb nova il·luminació i so i una interfície més fluida.",
        highlights: [
          "Sistemes de DJ i AudioAnalyzer amb detecció de beats i drops",
          "Llums, làsers i partícules que reaccionen a la música",
          "Sistema de begudes amb venedors NPC i efectes",
          "Comportaments de NPCs: venedors, idle, ball i activitat segons el context",
          "Monedes, recompenses diàries, missions, assoliments i badges",
          "VIP, cosmètics i integració de gamepasses"
        ],
        details: [
          { title: "Música", items: ["DJ propi i gestió de música", "Detecció de beats i drops", "Efectes visuals sincronitzats amb la música", "Il·luminació dinàmica, làsers i partícules"] },
          { title: "Interfícies", items: ["Menús principals i opcions", "Inventari, botiga i temes", "Ordres, missions i recompenses", "Interfícies socials i HUDs de joc"] },
          { title: "Suport mòbil", items: ["Interfícies adaptables i tàctils", "Escalat de la UI i millores d'scroll", "Compatibilitat amb la hotbar i navegació mòbil", "Provat a PC, tauleta i mòbil"] },
          { title: "Arquitectura", items: ["Enfocament modular amb sistemes reutilitzables", "Components de framework propis", "Sistemes que es mantenen i amplien per separat", "Persistència de dades i separació client/servidor"] }
        ]
      }
    },

    {
      id: "pocket-planet",
      color: "#a98bff",
      years: "2026 –",
      tone: "dev",
      layout: "compact",
      releaseBy: "2026-10",
      images: [{ src: "assets/img/pocket-planet.jpg", w: 400, h: 225 }],
      en: {
        title: "Pocket Planet",
        genre: "Collection and progression",
        status: "In development · release expected October 2026",
        role: "Systems, progression, VFX and game direction",
        alt: "A small planet floating in a purple starfield",
        tags: ["Progression", "Collection", "Pets", "VFX"],
        summary: "A progression and collection game I have been building and polishing from the ground up. Players explore planets, unlock new areas and collect pets, and advanced players always have something else to work towards.",
        highlights: [
          "Core loop, progression, worlds and UI flow",
          "Pet variants: Aqua, Fire, Snow, Rainy, Foggy, Rainbow, Oxidated, Corrupt and Godly",
          "Dedicated VFX for higher-tier pets, so rare pets look rare",
          "Extra VFX, particles and SFX on planets, rewards and key actions",
          "Tutorial and first-time player experience",
          "Thousands of automated tests plus manual Studio testing before each update"
        ],
        details: [
          { title: "Fixed during launch testing", items: ["Tutorial progression issues", "Portal exploits", "Server-side test behaviour", "Resets and game states that let players skip intended progression"] },
          { title: "Also built", items: ["Additional worlds and levels", "Progression balancing", "Gamepasses and developer products", "Performance improvements and a large amount of bug fixing"] },
          { title: "Beyond code", items: ["Deciding what content the game needs next", "Retention and future world planning", "Presentation polish", "Game icon, thumbnails and monetization artwork"] }
        ]
      },
      es: {
        title: "Pocket Planet",
        genre: "Colección y progresión",
        status: "En desarrollo · lanzamiento previsto en octubre de 2026",
        role: "Sistemas, progresión, VFX y dirección del juego",
        alt: "Un pequeño planeta flotando en un campo de estrellas morado",
        tags: ["Progresión", "Colección", "Mascotas", "VFX"],
        summary: "Un juego de progresión y colección que estoy construyendo y puliendo desde cero. Los jugadores exploran planetas, desbloquean zonas nuevas y coleccionan mascotas, y los más avanzados siempre tienen algo más por conseguir.",
        highlights: [
          "Bucle principal, progresión, mundos y flujo de UI",
          "Variantes de mascotas: Aqua, Fire, Snow, Rainy, Foggy, Rainbow, Oxidated, Corrupt y Godly",
          "VFX propios para las mascotas de nivel alto, para que las raras se vean raras",
          "VFX, partículas y SFX extra en planetas, recompensas y acciones clave",
          "Tutorial y experiencia del primer jugador",
          "Miles de tests automáticos y pruebas manuales en Studio antes de cada actualización"
        ],
        details: [
          { title: "Arreglado en las pruebas de lanzamiento", items: ["Problemas de progresión en el tutorial", "Exploits de portales", "Comportamiento de pruebas en el servidor", "Resets y estados de juego que permitían saltarse la progresión prevista"] },
          { title: "También he hecho", items: ["Mundos y niveles adicionales", "Balance de la progresión", "Gamepasses y developer products", "Mejoras de rendimiento y muchísimas correcciones de bugs"] },
          { title: "Más allá del código", items: ["Decidir qué contenido necesita el juego", "Retención y planificación de futuros mundos", "Pulido de la presentación", "Icono del juego, miniaturas y arte de monetización"] }
        ]
      },
      ca: {
        title: "Pocket Planet",
        genre: "Col·lecció i progressió",
        status: "En desenvolupament · llançament previst l'octubre del 2026",
        role: "Sistemes, progressió, VFX i direcció del joc",
        alt: "Un petit planeta surant en un camp d'estrelles morat",
        tags: ["Progressió", "Col·lecció", "Mascotes", "VFX"],
        summary: "Un joc de progressió i col·lecció que estic construint i polint des de zero. Els jugadors exploren planetes, desbloquegen zones noves i col·leccionen mascotes, i els més avançats sempre tenen alguna cosa més per aconseguir.",
        highlights: [
          "Bucle principal, progressió, mons i flux de UI",
          "Variants de mascotes: Aqua, Fire, Snow, Rainy, Foggy, Rainbow, Oxidated, Corrupt i Godly",
          "VFX propis per a les mascotes de nivell alt, perquè les rares es vegin rares",
          "VFX, partícules i SFX extra en planetes, recompenses i accions clau",
          "Tutorial i experiència del primer jugador",
          "Milers de tests automàtics i proves manuals a Studio abans de cada actualització"
        ],
        details: [
          { title: "Arreglat a les proves de llançament", items: ["Problemes de progressió al tutorial", "Exploits de portals", "Comportament de proves al servidor", "Resets i estats de joc que permetien saltar-se la progressió prevista"] },
          { title: "També he fet", items: ["Mons i nivells addicionals", "Equilibri de la progressió", "Gamepasses i developer products", "Millores de rendiment i moltíssimes correccions de bugs"] },
          { title: "Més enllà del codi", items: ["Decidir quin contingut necessita el joc", "Retenció i planificació de mons futurs", "Poliment de la presentació", "Icona del joc, miniatures i art de monetització"] }
        ]
      }
    },

    {
      id: "zpsentinel",
      color: "#5fe0e6",
      years: "2026 –",
      tone: "private",
      layout: "compact",
      developer: "ZPSTUDIOS",
      fit: "contain",
      images: [{ src: "assets/img/zpsentinel-logo.webp", w: 640, h: 626 }],
      en: {
        title: "ZPSentinel",
        genre: "Anti-cheat",
        status: "Private · updated 4 October 2026",
        role: "Roblox security and anti-cheat",
        alt: "ZPSentinel Anticheat logo: a purple shield with a padlock and the words Detect. Protect. Prevent.",
        tags: ["Security", "Anti-cheat", "Runtime analysis", "Server validation"],
        summary: "A custom security and anti-cheat system for Roblox. It combines detection, validation and analysis in one modular layer that can be added to different kinds of games, and gives developers a clear view of how secure their experience is.",
        highlights: [
          "Exploit and suspicious-behaviour detection",
          "Remote security and validation",
          "Server-side security systems",
          "Player behaviour monitoring",
          "Detection severity levels and security scoring with structured reports",
          "Event logging, configurable settings and admin tools"
        ],
        details: []
      },
      es: {
        title: "ZPSentinel",
        genre: "Anticheat",
        status: "Privado · actualizado el 4 de octubre de 2026",
        role: "Seguridad y anticheat para Roblox",
        alt: "Logo de ZPSentinel Anticheat: un escudo morado con un candado y el texto Detect. Protect. Prevent.",
        tags: ["Seguridad", "Anticheat", "Análisis en ejecución", "Validación en servidor"],
        summary: "Un sistema propio de seguridad y anticheat para Roblox. Combina detección, validación y análisis en una capa modular que se puede añadir a distintos tipos de juego, y da a los desarrolladores una visión clara de lo segura que es su experiencia.",
        highlights: [
          "Detección de exploits y comportamientos sospechosos",
          "Seguridad y validación de remotes",
          "Sistemas de seguridad en el servidor",
          "Monitorización del comportamiento de los jugadores",
          "Niveles de gravedad y puntuación de seguridad con informes estructurados",
          "Registro de eventos, ajustes configurables y herramientas de administración"
        ],
        details: []
      },
      ca: {
        title: "ZPSentinel",
        genre: "Anticheat",
        status: "Privat · actualitzat el 4 d'octubre del 2026",
        role: "Seguretat i anticheat per a Roblox",
        alt: "Logo de ZPSentinel Anticheat: un escut morat amb un cadenat i el text Detect. Protect. Prevent.",
        tags: ["Seguretat", "Anticheat", "Anàlisi en execució", "Validació al servidor"],
        summary: "Un sistema propi de seguretat i anticheat per a Roblox. Combina detecció, validació i anàlisi en una capa modular que es pot afegir a diferents tipus de joc, i dona als desenvolupadors una visió clara de com de segura és la seva experiència.",
        highlights: [
          "Detecció d'exploits i comportaments sospitosos",
          "Seguretat i validació de remotes",
          "Sistemes de seguretat al servidor",
          "Monitoratge del comportament dels jugadors",
          "Nivells de gravetat i puntuació de seguretat amb informes estructurats",
          "Registre d'esdeveniments, opcions configurables i eines d'administració"
        ],
        details: []
      }
    },

    {
      id: "mountain-party-club",
      color: "#5fe08a",
      years: "2025",
      tone: "old",
      layout: "compact",
      images: [{ src: "assets/img/mountain-party-club.jpg", w: 962, h: 515 }],
      en: {
        title: "Mountain Party Club",
        genre: "Party club with building",
        status: "Archived",
        role: "Building systems, multiplayer and UI",
        alt: "A DJ stage in a pine forest at night with green spotlights and a now-playing bar",
        tags: ["Building", "Multiplayer", "UI/UX"],
        summary: "A party club centred on player building. The game is no longer updated, but its build system is a good example of placement logic, permissions and validation.",
        highlights: [
          "Advanced, grid-based build mode",
          "Object placement, rotation, moving, editing and deletion",
          "Player-owned build areas with permissions and restrictions",
          "Furniture, structure and decoration placement",
          "Placement validation rules",
          "VIP build features and a dedicated build-mode UI"
        ],
        details: []
      },
      es: {
        title: "Mountain Party Club",
        genre: "Club de fiesta con construcción",
        status: "Archivado",
        role: "Sistemas de construcción, multijugador y UI",
        alt: "Un escenario de DJ en un bosque de pinos de noche con focos verdes y una barra de canción en reproducción",
        tags: ["Construcción", "Multijugador", "UI/UX"],
        summary: "Un club de fiesta centrado en la construcción por parte de los jugadores. El juego ya no se actualiza, pero su sistema de construcción es un buen ejemplo de lógica de colocación, permisos y validación.",
        highlights: [
          "Modo construcción avanzado basado en cuadrícula",
          "Colocar, rotar, mover, editar y borrar objetos",
          "Zonas de construcción propias con permisos y restricciones",
          "Colocación de muebles, estructuras y decoración",
          "Reglas de validación de colocación",
          "Funciones VIP de construcción y una UI propia para el modo construcción"
        ],
        details: []
      },
      ca: {
        title: "Mountain Party Club",
        genre: "Club de festa amb construcció",
        status: "Arxivat",
        role: "Sistemes de construcció, multijugador i UI",
        alt: "Un escenari de DJ en un bosc de pins de nit amb focus verds i una barra de cançó en reproducció",
        tags: ["Construcció", "Multijugador", "UI/UX"],
        summary: "Un club de festa centrat en la construcció per part dels jugadors. El joc ja no s'actualitza, però el seu sistema de construcció és un bon exemple de lògica de col·locació, permisos i validació.",
        highlights: [
          "Mode construcció avançat basat en quadrícula",
          "Col·locar, girar, moure, editar i esborrar objectes",
          "Zones de construcció pròpies amb permisos i restriccions",
          "Col·locació de mobles, estructures i decoració",
          "Regles de validació de col·locació",
          "Funcions VIP de construcció i una UI pròpia per al mode construcció"
        ],
        details: []
      }
    }
  ],

  experience: [
    {
      id: "tce",
      color: "#ef5f55",
      years: "2026 –",
      client: "Waterloo",
      image: { src: "assets/img/tce-continental-era.jpg", w: 1200, h: 675 },
      en: {
        title: "TCE: The Continental Era",
        genre: "Revolutionary War (client)",
        role: "Lead Gameplay / Systems Developer",
        clientLabel: "Client",
        period: "August 2026 – present",
        alt: "A Continental Army soldier in uniform standing next to an American flag on a snowy hill",
        summary: "A multi-place American Revolutionary War experience with separate places for land combat, naval warfare and training. My job is to extend, stabilize and modernize an existing production codebase without breaking the gameplay players already know. Real Roblox group ranks decide each player's uniform, equipment, access and authority.",
        systems: [
          ["Combat", "Server-authorized firing and damage, reload and ammo state, fire-rate limits, shot-origin and distance checks, bayonet and melee."],
          ["Artillery", "Multi-stage cannon loading, crew interactions, aiming and elevation limits, server-side projectiles, ownership and control claims."],
          ["Ranks & regiments", "Roblox group ranks mapped to uniforms, loadouts and permissions across Army, Navy and command groups, with cross-group priority."],
          ["Uniforms", "Rank-based clothing, accessories and headwear, hair rules under military hats, respawn-safe, with exceptions for special ranks."],
          ["Teams & spawning", "Continental, British and Naval factions. Flag-based forward spawns with cooldowns and a fallback to base."],
          ["Objectives", "Capture zones, faction ownership, capture progress, battlefield timers and synced zone state."],
          ["Officer commands", "Rank-restricted command tools, validated against the right group for each branch."],
          ["Naval", "Navy ranks, uniforms, permissions and naval artillery. Fleet Battle and Blockade modes in preparation."]
        ],
        // [symptom, cause]; leave cause empty when there is no separate cause
        bugs: [
          ["Artillery unusable after its first shot", "Elevation validation, firing state and event timing interacting"],
          ["Officers losing command access", "Permissions checked against the wrong group"],
          ["Character initialization failing", "Dynamically created capture zones"],
          ["Characters unable to auto-rotate after using a weapon", ""],
          ["Incorrect group-rank data", "Cached during gameplay"],
          ["Stale zone references", "Copied event tables"],
          ["Camera state breaking", "Mounted gameplay and outfit changes"],
          ["Initialization differences between the land and naval places", ""]
        ],
        process: [
          "Find which scripts are actually responsible for the behaviour.",
          "Map which systems depend on them.",
          "Trace which client and server parts talk to each other.",
          "Check whether the bug comes from the current feature or an inherited system.",
          "Make sure the change will not break compatibility elsewhere."
        ]
      },
      es: {
        title: "TCE: The Continental Era",
        genre: "Guerra de Independencia (cliente)",
        role: "Lead Gameplay / Systems Developer",
        clientLabel: "Cliente",
        period: "Agosto 2026 – actualidad",
        alt: "Un soldado del Ejército Continental de uniforme junto a una bandera estadounidense en una colina nevada",
        summary: "Una experiencia multi-place sobre la Guerra de Independencia de Estados Unidos, con places separados para combate terrestre, guerra naval y entrenamiento. Mi trabajo es ampliar, estabilizar y modernizar un código en producción sin romper el gameplay que los jugadores ya conocen. Los rangos reales de los grupos de Roblox deciden el uniforme, el equipo, los accesos y la autoridad de cada jugador.",
        systems: [
          ["Combate", "Disparo y daño autorizados por el servidor, estado de recarga y munición, límite de cadencia, comprobación del origen del disparo y de la distancia, bayoneta y cuerpo a cuerpo."],
          ["Artillería", "Carga del cañón por fases, interacción de la dotación, límites de puntería y elevación, proyectiles en el servidor, propiedad y control de la pieza."],
          ["Rangos y regimientos", "Rangos de grupos de Roblox asociados a uniformes, equipamiento y permisos en Ejército, Armada y mando, con prioridad entre grupos."],
          ["Uniformes", "Ropa, accesorios y sombreros según el rango, reglas para el pelo bajo el sombrero militar, resistentes al respawn, con excepciones para rangos especiales."],
          ["Equipos y spawns", "Facciones Continental, Británica y Naval. Spawns avanzados en banderas con cooldown y vuelta a la base si no hay ninguna válida."],
          ["Objetivos", "Zonas de captura, control por facción, progreso de captura, temporizadores de batalla y estado de zona sincronizado."],
          ["Mando de oficiales", "Herramientas de mando restringidas por rango y validadas contra el grupo correcto de cada rama."],
          ["Naval", "Rangos, uniformes, permisos y artillería de la Armada. Modos Fleet Battle y Blockade en preparación."]
        ],
        // [symptom, cause]; leave cause empty when there is no separate cause
        bugs: [
          ["Artillería inutilizable tras el primer disparo", "Interacción entre la validación de elevación, el estado de disparo y el orden de los eventos"],
          ["Oficiales que perdían el acceso al mando", "Permisos comprobados contra el grupo equivocado"],
          ["Fallos al inicializar personajes", "Zonas de captura creadas dinámicamente"],
          ["Personajes que dejaban de girar automáticamente tras usar un arma", ""],
          ["Datos de rango de grupo incorrectos", "Guardados en caché durante la partida"],
          ["Referencias a zonas obsoletas", "Tablas de eventos copiadas"],
          ["Estado de cámara roto", "Ir a caballo y cambiar de uniforme"],
          ["Diferencias de inicialización entre los places terrestre y naval", ""]
        ],
        process: [
          "Averiguar qué scripts son realmente responsables del comportamiento.",
          "Mapear qué sistemas dependen de ellos.",
          "Seguir qué partes del cliente y del servidor se comunican entre sí.",
          "Comprobar si el bug viene de la función actual o de un sistema heredado.",
          "Asegurarme de que el cambio no rompe la compatibilidad en otro sitio."
        ]
      },
      ca: {
        title: "TCE: The Continental Era",
        genre: "Guerra d'Independència (client)",
        role: "Lead Gameplay / Systems Developer",
        clientLabel: "Client",
        period: "Agost 2026 – actualitat",
        alt: "Un soldat de l'Exèrcit Continental d'uniforme al costat d'una bandera dels Estats Units en un turó nevat",
        summary: "Una experiència multi-place sobre la Guerra d'Independència dels Estats Units, amb places separats per al combat terrestre, la guerra naval i l'entrenament. La meva feina és ampliar, estabilitzar i modernitzar un codi en producció sense trencar el gameplay que els jugadors ja coneixen. Els rangs reals dels grups de Roblox decideixen l'uniforme, l'equip, els accessos i l'autoritat de cada jugador.",
        systems: [
          ["Combat", "Tret i dany autoritzats pel servidor, estat de recàrrega i munició, límit de cadència, comprovació de l'origen del tret i de la distància, baioneta i cos a cos."],
          ["Artilleria", "Càrrega del canó per fases, interacció de la dotació, límits de punteria i elevació, projectils al servidor, propietat i control de la peça."],
          ["Rangs i regiments", "Rangs de grups de Roblox associats a uniformes, equipament i permisos a l'Exèrcit, l'Armada i el comandament, amb prioritat entre grups."],
          ["Uniformes", "Roba, accessoris i barrets segons el rang, regles per als cabells sota el barret militar, resistents al respawn, amb excepcions per a rangs especials."],
          ["Equips i spawns", "Faccions Continental, Britànica i Naval. Spawns avançats a les banderes amb cooldown i tornada a la base si no n'hi ha cap de vàlida."],
          ["Objectius", "Zones de captura, control per facció, progrés de captura, temporitzadors de batalla i estat de zona sincronitzat."],
          ["Comandament d'oficials", "Eines de comandament restringides per rang i validades contra el grup correcte de cada branca."],
          ["Naval", "Rangs, uniformes, permisos i artilleria de l'Armada. Modes Fleet Battle i Blockade en preparació."]
        ],
        // [symptom, cause]; leave cause empty when there is no separate cause
        bugs: [
          ["Artilleria inutilitzable després del primer tret", "Interacció entre la validació d'elevació, l'estat de tret i l'ordre dels esdeveniments"],
          ["Oficials que perdien l'accés al comandament", "Permisos comprovats contra el grup equivocat"],
          ["Errors en inicialitzar personatges", "Zones de captura creades dinàmicament"],
          ["Personatges que deixaven de girar automàticament després de fer servir una arma", ""],
          ["Dades de rang de grup incorrectes", "Desades a la memòria cau durant la partida"],
          ["Referències a zones obsoletes", "Taules d'esdeveniments copiades"],
          ["Estat de càmera trencat", "Anar a cavall i canviar d'uniforme"],
          ["Diferències d'inicialització entre els places terrestre i naval", ""]
        ],
        process: [
          "Esbrinar quins scripts són realment responsables del comportament.",
          "Mapejar quins sistemes en depenen.",
          "Seguir quines parts del client i del servidor es comuniquen entre si.",
          "Comprovar si el bug ve de la funció actual o d'un sistema heretat.",
          "Assegurar-me que el canvi no trenca la compatibilitat en cap altre lloc."
        ]
      }
    }
  ],

  rates: {
    perTask: {
      price: "$15 – $115",
      method: "PayPal",
      crypto: { en: "95 XRP or ≈ 0.00169 BTC", es: "95 XRP o ≈ 0,00169 BTC", ca: "95 XRP o ≈ 0,00169 BTC" }
    },
    longTerm: [
      { hours: 20, price: "$500 – $1,100", en: "Part-time", es: "Media jornada", ca: "Mitja jornada" },
      { hours: 30, price: "$1,500 – $2,200", en: "Extended", es: "Jornada ampliada", ca: "Jornada ampliada" },
      { hours: 40, price: "$2,000 – $3,000+", en: "Full-time", es: "Jornada completa", ca: "Jornada completa" }
    ]
  }
};
