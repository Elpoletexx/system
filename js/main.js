(function () {
  "use strict";

  var DATA = window.PORTFOLIO;
  var LANGS = ["ca", "es", "en"];
  var STORAGE_KEY = "plvz03-lang";
  var REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var REEL_INTERVAL_MS = 6000;

  var root = document.documentElement;
  var currentLang = "en";

  // Build DOM nodes without innerHTML so content text is never parsed as markup.
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === "class") el.className = value;
        else if (key === "text") el.textContent = value;
        else el.setAttribute(key, value);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      if (child === null || child === undefined) continue;
      if (Array.isArray(child)) child.forEach(function (c) { if (c) el.appendChild(c); });
      else el.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return el;
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
    return el;
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function readStoredLang() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function storeLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage unavailable */ }
  }

  function detectLang() {
    var stored = readStoredLang();
    if (LANGS.indexOf(stored) !== -1) return stored;
    var prefs = navigator.languages || [navigator.language || "en"];
    for (var i = 0; i < prefs.length; i++) {
      var code = String(prefs[i]).slice(0, 2).toLowerCase();
      if (LANGS.indexOf(code) !== -1) return code;
    }
    return "en";
  }

  // Looks up a project or client job by id and returns its main image.
  function findWork(id) {
    var all = DATA.projects.concat(DATA.experience);
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) {
        return { item: all[i], image: all[i].image || all[i].images[0] };
      }
    }
    return null;
  }

  /* ---------- Scroll reveal ---------- */

  var revealObserver = null;
  if (!REDUCED_MOTION && "IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    root.classList.add("has-reveal");
  }

  function observeReveals() {
    document.querySelectorAll("[data-reveal]:not(.is-in)").forEach(function (el) {
      if (revealObserver) revealObserver.observe(el);
      else el.classList.add("is-in");
    });
  }

  /* ---------- Hero showreel ---------- */

  var reel = { items: [], index: 0, timer: null };

  function buildReel() {
    var slides = document.getElementById("hero-slides");
    var bars = document.getElementById("reel-bars");
    reel.items = DATA.heroReel.map(findWork).filter(Boolean);
    reel.items.forEach(function (work, i) {
      slides.appendChild(h("div", { class: "slide" },
        h("img", { src: work.image.src, width: work.image.w, height: work.image.h, alt: "", decoding: "async", fetchpriority: i === 0 ? "high" : null })
      ));
      var bar = h("button", { type: "button", class: "reel__bar", "aria-label": String(i + 1) }, h("span"));
      bar.addEventListener("click", function () { goToSlide(i, true); });
      bars.appendChild(bar);
    });
  }

  function renderReelCaption() {
    var work = reel.items[reel.index];
    if (!work) return;
    document.getElementById("reel-count").textContent = pad2(reel.index + 1) + " / " + pad2(reel.items.length);
    document.getElementById("reel-name").textContent = work.item[currentLang].title;
    document.getElementById("reel-caption").setAttribute("href", "#" + work.item.id);
  }

  function goToSlide(i, manual) {
    var slides = document.querySelectorAll(".slide");
    var bars = document.querySelectorAll(".reel__bar");
    reel.index = (i + reel.items.length) % reel.items.length;
    slides.forEach(function (s, n) { s.classList.toggle("is-active", n === reel.index); });
    bars.forEach(function (b, n) {
      b.classList.remove("is-active");
      b.classList.toggle("is-done", n < reel.index);
      b.setAttribute("aria-current", n === reel.index ? "true" : "false");
    });
    var active = bars[reel.index];
    if (active) {
      void active.offsetWidth; // restart the progress animation
      active.classList.add("is-active");
    }
    renderReelCaption();
    if (manual) restartReel();
  }

  function restartReel() {
    clearInterval(reel.timer);
    reel.timer = null;
    if (REDUCED_MOTION || document.hidden) return;
    reel.timer = setInterval(function () { goToSlide(reel.index + 1, false); }, REEL_INTERVAL_MS);
  }

  /* ---------- Static and about ---------- */

  function renderStatic(t) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var value = t[el.getAttribute("data-i18n")];
      if (typeof value === "string") el.textContent = value;
    });

    var facts = clear(document.getElementById("facts"));
    t.stats.forEach(function (pair) {
      facts.appendChild(h("div", { class: "fact" }, h("dd", { text: pair[1] }), h("dt", { text: pair[0] })));
    });

    var skills = clear(document.getElementById("skills"));
    t["skills.items"].forEach(function (pair) {
      skills.appendChild(h("li", { class: "skill" }, h("span", { class: "skill__name", text: pair[0] }), h("span", { class: "skill__text", text: pair[1] })));
    });

    document.getElementById("stack").textContent = DATA.stack.join(", ");
  }

  var manifestoWords = [];

  function renderManifesto(t) {
    var el = clear(document.getElementById("manifesto"));
    var words = t["manifesto.text"].replace(/[“”«»]/g, "").split(/\s+/);
    manifestoWords = words.map(function (word) {
      var span = h("span", { class: "word", text: word });
      el.appendChild(span);
      el.appendChild(document.createTextNode(" "));
      return span;
    });
    lastLit = -1;
    updateManifesto();
  }

  /* ---------- Projects ---------- */

  function detailItem(item) {
    if (Array.isArray(item)) return h("li", null, h("strong", { text: item[0] }), " " + item[1]);
    return h("li", { text: item });
  }

  function zoomable(img, t, extraClass) {
    var button = h("button", { type: "button", class: "zoom" + (extraClass ? " " + extraClass : ""), "aria-label": t["label.enlarge"] + ": " + img.getAttribute("alt") }, img);
    button.addEventListener("click", function () { openLightbox(img.getAttribute("src"), img.getAttribute("alt")); });
    return button;
  }

  function collapsible(id, label, content) {
    var panelId = id + "-more";
    var button = h("button", { type: "button", class: "more__toggle", "aria-expanded": "false", "aria-controls": panelId },
      h("span", { class: "more__icon", "aria-hidden": "true" }), h("span", { text: label })
    );
    var panel = h("div", { class: "collapse", id: panelId }, h("div", { class: "collapse__inner" }, content));
    button.addEventListener("click", function () {
      var open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
    });
    return h("div", { class: "more" }, button, panel);
  }

  function renderIndex(lang, t) {
    var index = clear(document.getElementById("project-index"));
    var head = t["projects.index"];
    index.appendChild(h("div", { class: "index__row index__row--head", "aria-hidden": "true" },
      head.map(function (label) { return h("span", { text: label }); })
    ));
    DATA.projects.forEach(function (p, i) {
      var c = p[lang];
      index.appendChild(h("a", {
        class: "index__row", href: "#" + p.id, "data-img": p.images[0].src, "data-reveal": "", style: "--p:" + p.color + ";--d:" + i
      },
        h("span", { class: "index__name", text: c.title }),
        h("span", { class: "index__genre", text: c.tags[0] }),
        h("span", { class: "index__years", text: p.years }),
        h("span", { class: "index__status tone tone--" + p.tone, text: c.status.split(" · ")[0] })
      ));
    });
  }

  function caseHead(title, metaItems) {
    return h("header", { class: "case__head", "data-reveal": "" },
      h("h3", { class: "case__title", text: title }),
      h("dl", { class: "case__meta" }, metaItems.filter(Boolean).map(function (m) {
        return h("div", null, h("dt", { text: m[0] }), h("dd", { class: m[2] || null, text: m[1] }));
      }))
    );
  }

  function renderProjects(lang, t) {
    var list = clear(document.getElementById("project-list"));
    DATA.projects.forEach(function (p) {
      var c = p[lang];
      var main = p.images[0];
      var statusParts = c.status.split(" · ");

      var media = h("div", { class: "case__media" + (p.fit === "contain" ? " case__media--contain" : ""), "data-reveal": "clip" },
        zoomable(h("img", { class: "parallax", src: main.src, width: main.w, height: main.h, alt: c.alt, loading: "lazy", decoding: "async" }), t)
      );

      var extra = p.images[1]
        ? h("figure", { class: "case__extra" },
            zoomable(h("img", { src: p.images[1].src, width: p.images[1].w, height: p.images[1].h, alt: c.altExtra || "", loading: "lazy", decoding: "async" }), t))
        : null;

      var more = c.details && c.details.length
        ? collapsible(p.id, t["label.more"], h("div", { class: "case__groups" }, c.details.map(function (group) {
            return h("div", { class: "group" }, h("h4", { text: group.title }), h("ul", null, group.items.map(detailItem)));
          })))
        : null;

      list.appendChild(h("article", { class: "case", id: p.id, style: "--p:" + p.color },
        caseHead(c.title, [
          [t["projects.index"][3], statusParts.join(" · "), "tone tone--" + p.tone],
          [t["projects.index"][2], p.years],
          [t["label.role"], c.role],
          p.developer ? [t["label.developer"], p.developer] : null
        ]),
        media,
        h("div", { class: "case__body" },
          h("div", { class: "case__lead", "data-reveal": "" },
            h("p", { class: "case__summary", text: c.summary }),
            h("p", { class: "case__tags", text: c.tags.join(" / ") })
          ),
          h("div", { class: "case__points", "data-reveal": "" },
            h("ul", { class: "points" }, c.highlights.map(function (item) { return h("li", { text: item }); })),
            extra
          )
        ),
        more
      ));
    });
  }

  /* ---------- Client work ---------- */

  function renderExperience(lang, t) {
    var body = document.getElementById("experience-body");
    body.querySelectorAll(".case").forEach(function (el) { el.remove(); });

    DATA.experience.forEach(function (job) {
      var c = job[lang];
      body.appendChild(h("article", { class: "case case--job", id: job.id, style: "--p:" + job.color },
        caseHead(c.title, [
          [t["label.role"], c.role],
          [c.clientLabel, job.client],
          [t["projects.index"][2], c.period, "tone tone--live"]
        ]),
        h("div", { class: "case__media", "data-reveal": "clip" },
          zoomable(h("img", { class: "parallax", src: job.image.src, width: job.image.w, height: job.image.h, alt: c.alt, loading: "lazy", decoding: "async" }), t)
        ),
        h("p", { class: "case__summary case__summary--wide", "data-reveal": "", text: c.summary }),
        h("div", { class: "job__block" },
          h("h4", { class: "kicker", "data-reveal": "", text: t["experience.systems"] }),
          h("ul", { class: "systems" }, c.systems.map(function (pair, i) {
            return h("li", { class: "system", "data-reveal": "", style: "--d:" + (i % 4) },
              h("h5", { text: pair[0] }), h("p", { text: pair[1] }));
          }))
        ),
        h("div", { class: "job__columns" },
          h("div", { class: "job__block", "data-reveal": "" },
            h("h4", { class: "kicker", text: t["experience.bugs"] }),
            h("p", { class: "muted", text: t["experience.bugsIntro"] }),
            h("ul", { class: "bugs" }, c.bugs.map(function (bug) { return h("li", { text: bug }); }))
          ),
          h("div", { class: "job__block", "data-reveal": "" },
            h("h4", { class: "kicker", text: t["experience.process"] }),
            h("ol", { class: "steps" }, c.process.map(function (step) { return h("li", { text: step }); })),
            h("p", { class: "muted", text: t["experience.processOutro"] })
          )
        )
      ));
    });
  }

  /* ---------- Rates ---------- */

  function renderRates(lang, t) {
    var body = clear(document.getElementById("rates-body"));

    body.appendChild(h("div", { class: "rates__col", "data-reveal": "" },
      h("h3", { class: "kicker", text: t["rates.perTask"] }),
      h("dl", { class: "price-list" }, DATA.rates.perTask.map(function (r) {
        return h("div", { class: "price-list__row" }, h("dt", { text: r.method }), h("dd", { text: r.amount }));
      }))
    ));

    body.appendChild(h("div", { class: "rates__col", "data-reveal": "" },
      h("h3", { class: "kicker", text: t["rates.longTerm"] }),
      h("ul", { class: "plans" }, DATA.rates.longTerm.map(function (r) {
        return h("li", { class: "plan" },
          h("span", { class: "plan__name", text: r[lang] }),
          h("span", { class: "plan__hours" }, h("strong", { text: String(r.hours) }), " " + t["rates.hoursUnit"]),
          h("span", { class: "plan__price" }, r.price, h("small", { text: t["rates.monthly"] }))
        );
      }))
    ));
  }

  /* ---------- Contact and footer ---------- */

  function copyText(button, source, value, t) {
    function done() {
      button.textContent = t["footer.copied"];
      button.classList.add("is-done");
      setTimeout(function () {
        button.textContent = t["footer.copy"];
        button.classList.remove("is-done");
      }, 1600);
    }
    function selectFallback() {
      var range = document.createRange();
      range.selectNodeContents(source);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(done, selectFallback);
    else selectFallback();
  }

  function renderContact(t) {
    var list = clear(document.getElementById("contact-list"));
    DATA.contact.forEach(function (c, i) {
      var external = c.href && c.href.indexOf("http") === 0;
      var value = c.href
        ? h("a", { class: "contact__value", href: c.href, target: external ? "_blank" : null, rel: external ? "noopener noreferrer" : null, text: c.value })
        : h("span", { class: "contact__value", text: c.value });
      var copy = h("button", { type: "button", class: "contact__copy", text: t["footer.copy"] });
      copy.addEventListener("click", function () { copyText(copy, value, c.value, t); });
      list.appendChild(h("li", { class: "contact__row", "data-reveal": "", style: "--d:" + i },
        h("span", { class: "contact__label", text: c.label }), value, copy
      ));
    });
  }

  function renderFooter(t) {
    var footer = clear(document.getElementById("footer"));
    footer.appendChild(h("p", { class: "footer__brand" }, h("strong", { text: DATA.handle }), " — " + t["footer.built"]));
    footer.appendChild(h("p", { class: "footer__langs", text: t["footer.languages"] + ": " + DATA.languagesSpoken.join(", ") }));
    footer.appendChild(h("a", { class: "footer__top", href: "#top", "aria-label": "Top", text: "↑" }));
  }

  /* ---------- Lightbox ---------- */

  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    if (typeof lightbox.showModal === "function") lightbox.showModal();
  }

  document.getElementById("lightbox-close").addEventListener("click", function () { lightbox.close(); });
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) lightbox.close(); });

  /* ---------- Index hover preview (desktop) ---------- */

  function setupPreview() {
    if (!FINE_POINTER || REDUCED_MOTION) return;
    var preview = document.getElementById("preview");
    var img = document.getElementById("preview-img");
    var index = document.getElementById("project-index");
    var pos = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    var running = false;

    function loop() {
      pos.x += (target.x - pos.x) * 0.16;
      pos.y += (target.y - pos.y) * 0.16;
      preview.style.transform = "translate3d(" + pos.x + "px," + pos.y + "px,0)";
      if (running) requestAnimationFrame(loop);
    }

    index.addEventListener("mousemove", function (e) {
      target.x = e.clientX + 24;
      target.y = e.clientY - 90;
    });
    index.addEventListener("mouseover", function (e) {
      var row = e.target.closest(".index__row[data-img]");
      if (!row) return;
      if (img.getAttribute("src") !== row.getAttribute("data-img")) img.src = row.getAttribute("data-img");
      if (!running) {
        pos.x = target.x = e.clientX + 24;
        pos.y = target.y = e.clientY - 90;
        running = true;
        requestAnimationFrame(loop);
      }
      preview.classList.add("is-on");
    });
    index.addEventListener("mouseleave", function () {
      preview.classList.remove("is-on");
      running = false;
    });
  }

  /* ---------- Scroll-driven effects ---------- */

  var nav = document.getElementById("nav");
  var lastY = window.scrollY;
  var lastLit = -1;
  var ticking = false;

  function updateManifesto() {
    if (!manifestoWords.length) return;
    var lit = manifestoWords.length;
    if (!REDUCED_MOTION) {
      var el = document.getElementById("manifesto");
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh * 0.85 - r.top) / (r.height + vh * 0.4);
      lit = Math.round(Math.max(0, Math.min(1, progress)) * manifestoWords.length);
    }
    if (lit === lastLit) return;
    lastLit = lit;
    manifestoWords.forEach(function (w, i) { w.classList.toggle("is-lit", i < lit); });
  }

  function updateParallax() {
    if (REDUCED_MOTION) return;
    var vh = window.innerHeight;
    document.querySelectorAll(".parallax").forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var offset = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.transform = "translate3d(0," + (offset * -36).toFixed(1) + "px,0) scale(1.1)";
    });
  }

  function updateNav() {
    var y = window.scrollY;
    nav.classList.toggle("is-solid", y > 40);
    var hide = y > lastY && y > 480 && !nav.contains(document.activeElement);
    nav.classList.toggle("is-hidden", hide);
    lastY = y;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateNav();
      updateManifesto();
      updateParallax();
      ticking = false;
    });
  }

  /* ---------- Language ---------- */

  function render(lang) {
    var t = DATA.ui[lang];
    currentLang = lang;
    root.lang = lang;
    document.querySelectorAll(".lang button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === lang));
    });
    renderStatic(t);
    renderManifesto(t);
    renderReelCaption();
    renderIndex(lang, t);
    renderProjects(lang, t);
    renderExperience(lang, t);
    renderRates(lang, t);
    renderContact(t);
    renderFooter(t);
    observeReveals();
    updateParallax();
  }

  document.querySelectorAll(".lang button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var lang = btn.getAttribute("data-lang");
      if (lang === currentLang) return;
      storeLang(lang);
      var main = document.getElementById("top");
      if (REDUCED_MOTION) { render(lang); return; }
      main.classList.add("is-switching");
      setTimeout(function () {
        render(lang);
        main.classList.remove("is-switching");
      }, 220);
    });
  });

  buildReel();
  currentLang = detectLang();
  goToSlide(0, false);
  render(currentLang);
  restartReel();
  setupPreview();

  document.addEventListener("visibilitychange", restartReel);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  requestAnimationFrame(function () { root.classList.add("is-loaded"); });
})();
