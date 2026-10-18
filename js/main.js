(function () {
  "use strict";

  var DATA = window.PORTFOLIO;
  var LANGS = ["ca", "es", "en"];
  var STORAGE_KEY = "plvz03-lang";
  var REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      if (all[i].id === id) return { item: all[i], image: all[i].image || all[i].images[0] };
    }
    return null;
  }

  // Drops the release estimate from a status once its month has passed.
  function statusText(p, c) {
    if (p.releaseBy) {
      var parts = p.releaseBy.split("-");
      if (new Date() >= new Date(+parts[0], +parts[1], 1)) return c.status.split(" · ")[0];
    }
    return c.status;
  }

  /* ---------- Reveal (screenshot wipes and section rules) ---------- */

  var revealObserver = null;
  if (!REDUCED_MOTION && "IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        revealObserver.unobserve(el);
        el.addEventListener("transitionend", function done(e) {
          if (e.target !== el) return;
          el.removeEventListener("transitionend", done);
          el.removeAttribute("data-reveal");
          el.classList.remove("is-in");
        });
        el.classList.add("is-in");
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0 });
    root.classList.add("has-reveal");
  }

  function observeReveals(skip) {
    document.querySelectorAll("[data-reveal]:not(.is-in)").forEach(function (el) {
      if (revealObserver && !skip) revealObserver.observe(el);
      else el.removeAttribute("data-reveal");
    });
  }

  /* ---------- Hero ---------- */

  function renderStatic(t) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var value = t[el.getAttribute("data-i18n")];
      if (typeof value === "string") el.textContent = value;
    });
    document.querySelectorAll("[data-i18n-label]").forEach(function (el) {
      var value = t[el.getAttribute("data-i18n-label")];
      if (typeof value === "string") el.setAttribute("aria-label", value);
    });

    var skills = clear(document.getElementById("skills"));
    t["skills.items"].forEach(function (pair) {
      skills.appendChild(h("li", { class: "skill" }, h("span", { class: "skill__name", text: pair[0] }), h("span", { class: "skill__text", text: pair[1] })));
    });
    document.getElementById("stack").textContent = DATA.stack[currentLang].join(", ");
  }

  function renderHeroWork(lang) {
    var list = clear(document.getElementById("hero-work"));
    DATA.heroWork.forEach(function (entry, i) {
      var w = findWork(entry.id);
      if (!w) return;
      var c = w.item[lang];
      list.appendChild(h("li", { style: "--i:" + i },
        h("a", { href: "#" + w.item.id },
          h("span", { class: "hero__thumb" },
            h("img", { src: w.image.src, width: w.image.w, height: w.image.h, alt: "", decoding: "async", fetchpriority: i === 0 ? "high" : null, style: "object-position:" + entry.focus })
          ),
          h("span", { class: "hero__work-name", text: c.title }),
          h("span", { class: "hero__work-type", text: c.genre })
        )
      ));
    });
  }

  /* ---------- Shared case pieces ---------- */

  function detailItem(item) {
    if (Array.isArray(item)) return h("li", null, h("strong", { text: item[0] }), " — " + item[1]);
    return h("li", { text: item });
  }

  function zoomable(img, t) {
    var button = h("button", { type: "button", class: "zoom", "aria-label": t["label.enlarge"] + ": " + img.getAttribute("alt") }, img);
    button.addEventListener("click", function () { openLightbox(img.getAttribute("src"), img.getAttribute("alt")); });
    return button;
  }

  function collapsible(id, label, content) {
    var panelId = id + "-more";
    var button = h("button", { type: "button", class: "more__toggle", "aria-expanded": "false", "aria-controls": panelId, "aria-describedby": id + "-title" },
      h("span", { class: "more__icon", "aria-hidden": "true" }), h("span", { text: label })
    );
    var panel = h("div", { class: "collapse", id: panelId, inert: "" }, h("div", { class: "collapse__inner" }, content));
    button.addEventListener("click", function () {
      var open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
      panel.inert = !open;
    });
    return h("div", { class: "more" }, button, panel);
  }

  function breakdown(id, details, t, level) {
    if (!details || !details.length) return null;
    return collapsible(id, t["label.more"], h("div", { class: "case__groups" }, details.map(function (group) {
      return h("div", { class: "group" }, h(level || "h4", { class: "label", text: group.title }), h("ul", null, group.items.map(detailItem)));
    })));
  }

  function caseHead(title, metaItems, kicker, id) {
    return h("header", { class: "case__head" },
      kicker ? h("p", { class: "case__kicker label", text: kicker }) : null,
      h("h3", { class: "case__title", id: id ? id + "-title" : null, text: title }),
      h("dl", { class: "case__meta" }, metaItems.filter(Boolean).map(function (m) {
        return h("div", null, h("dt", { class: "label", text: m[0] }), h("dd", null, h("span", { class: m[2] || null, text: m[1] })));
      }))
    );
  }

  function featureMedia(image, alt, t) {
    return h("div", { class: "case__media", "data-reveal": "clip" },
      h("img", { src: image.src, width: image.w, height: image.h, alt: alt, loading: "lazy", decoding: "async" })
    );
  }

  /* ---------- Project index ---------- */

  function renderIndex(lang, t) {
    var index = clear(document.getElementById("project-index"));
    var head = t["projects.index"];
    index.appendChild(h("div", { class: "index__row index__row--head", "aria-hidden": "true" },
      head.map(function (label) { return h("span", { class: "label", text: label }); })
    ));

    function row(id, color, title, genre, years, status, tone) {
      return h("a", { class: "index__row", href: "#" + id, style: "--p:" + color },
        h("span", { class: "index__name" }, h("span", { text: title })),
        h("span", { class: "index__genre", text: genre }),
        h("span", { class: "index__years", text: years }),
        h("span", { class: "index__status" }, h("span", { class: "tone tone--" + tone, text: status }))
      );
    }

    DATA.experience.forEach(function (job) {
      var c = job[lang];
      index.appendChild(row(job.id, job.color, c.title, c.genre, job.years, t["status.active"], "live"));
    });
    DATA.projects.forEach(function (p) {
      var c = p[lang];
      index.appendChild(row(p.id, p.color, c.title, c.genre, p.years, statusText(p, c).split(" · ")[0], p.tone));
    });
  }

  /* ---------- Projects ---------- */

  function renderFeature(p, c, t) {
    var extra = p.images[1]
      ? h("figure", { class: "case__extra" },
          h("img", { src: p.images[1].src, width: p.images[1].w, height: p.images[1].h, alt: c.altExtra || "", loading: "lazy", decoding: "async" }))
      : null;

    return h("article", { class: "case", id: p.id, style: "--p:" + p.color },
      caseHead(c.title, [
        [t["projects.index"][3], statusText(p, c), "tone tone--" + p.tone],
        [t["projects.index"][2], p.years],
        [t["label.role"], c.role],
        p.developer ? [t["label.developer"], p.developer] : null
      ], null, p.id),
      featureMedia(p.images[0], c.alt, t),
      h("div", { class: "case__body" },
        h("div", { class: "case__lead" },
          h("p", { class: "case__summary", text: c.summary }),
          h("p", { class: "case__tags", text: c.tags.join(" / ") })
        ),
        h("div", { class: "case__points" },
          h("ul", { class: "points" }, c.highlights.map(function (item) { return h("li", { text: item }); })),
          extra
        )
      ),
      breakdown(p.id, c.details, t)
    );
  }

  function renderCompact(p, c, t) {
    var img = p.images[0];
    var imgEl = h("img", { src: img.src, width: img.w, height: img.h, alt: c.alt, loading: "lazy", decoding: "async" });
    return h("article", { class: "case case--compact", id: p.id, style: "--p:" + p.color },
      h("div", { class: "case__thumb" + (p.fit === "contain" ? " case__thumb--contain" : "") },
        img.w >= 640 ? zoomable(imgEl, t) : imgEl
      ),
      h("h4", { class: "case__title", id: p.id + "-title", text: c.title }),
      h("p", { class: "case__line" },
        h("span", { class: "tone tone--" + p.tone, text: statusText(p, c) }),
        h("span", { class: "case__years", text: p.years })
      ),
      h("p", { class: "case__summary", text: c.summary }),
      h("ul", { class: "points" }, c.highlights.map(function (item) { return h("li", { text: item }); })),
      breakdown(p.id, c.details, t, "h5")
    );
  }

  function renderProjects(lang, t) {
    var list = clear(document.getElementById("project-list"));
    var compact = clear(document.getElementById("project-compact"));
    DATA.projects.forEach(function (p) {
      var c = p[lang];
      if (p.layout === "compact") compact.appendChild(renderCompact(p, c, t));
      else list.appendChild(renderFeature(p, c, t));
    });
  }

  /* ---------- Client work (rendered first in the project list) ---------- */

  function renderExperience(lang, t) {
    var list = document.getElementById("project-list");
    DATA.experience.slice().reverse().forEach(function (job) {
      var c = job[lang];
      var bugRows = c.bugs.map(function (bug) {
        return h("tr", null, h("td", { text: bug[0] }), h("td", { text: bug[1], "data-label": t["experience.cause"] }));
      });
      var hasOther = c.other && c.other.length;

      list.insertBefore(h("article", { class: "case case--job", id: job.id, style: "--p:" + job.color },
        caseHead(c.title, [
          [t["label.role"], c.role],
          [c.clientLabel, job.client],
          [t["label.period"], c.period, "tone tone--live"]
        ], t["experience.title"], job.id),
        featureMedia(job.image, c.alt, t),
        h("p", { class: "case__summary case__summary--wide", text: c.summary }),
        h("div", { class: "job__block" },
          h("h4", { class: "label", text: t["experience.bugs"] }),
          h("p", { class: "job__intro", text: t["experience.bugsIntro"] }),
          h("div", { class: "table-scroll" },
            h("table", { class: "bugs" },
              h("thead", null, h("tr", null,
                h("th", { scope: "col", class: "label", text: t["experience.symptom"] }),
                h("th", { scope: "col", class: "label", text: t["experience.cause"] })
              )),
              h("tbody", null, bugRows)
            )
          ),
          hasOther ? h("h5", { class: "label", text: t["experience.otherBugs"] }) : null,
          hasOther ? h("ul", { class: "points" }, c.other.map(function (b) { return h("li", { text: b }); })) : null
        ),
        h("div", { class: "job__block" },
          h("h4", { class: "label", text: t["experience.systems"] }),
          h("ul", { class: "systems" }, c.systems.map(function (pair) {
            return h("li", { class: "system" }, h("h5", { text: pair[0] }), h("p", { text: pair[1] }));
          }))
        ),
        h("div", { class: "job__block job__block--narrow" },
          h("h4", { class: "label", text: t["experience.process"] }),
          h("ol", { class: "steps" }, c.process.map(function (step) { return h("li", { text: step }); })),
          h("p", { class: "job__intro", text: t["experience.processOutro"] })
        )
      ), list.firstChild);
    });
  }

  /* ---------- Rates ---------- */

  function renderRates(lang, t) {
    var body = clear(document.getElementById("rates-body"));
    var task = DATA.rates.perTask;

    body.appendChild(h("div", { class: "rates__col" },
      h("h3", { class: "label", text: t["rates.perTask"] }),
      h("p", { class: "rate__price" }, task.price[lang] + " ", h("span", { class: "rate__via", text: t["rates.via"] + " " + task.method })),
      h("p", { class: "rate__note", text: t["rates.crypto"] + " " + task.crypto[lang] })
    ));

    body.appendChild(h("div", { class: "rates__col" },
      h("h3", { class: "label", text: t["rates.longTerm"] }),
      h("ul", { class: "plans" },
        h("li", { class: "plan plan--head", "aria-hidden": "true" },
          h("span", { class: "label", text: t["rates.plan"] }),
          h("span", { class: "label", text: t["rates.hours"] }),
          h("span", { class: "label", text: t["rates.monthly"] })
        ),
        DATA.rates.longTerm.map(function (r) {
          return h("li", { class: "plan" },
            h("span", { class: "plan__name", text: r[lang] }),
            h("span", { class: "plan__hours" }, h("strong", { text: String(r.hours) }), " " + t["rates.hoursUnit"]),
            h("span", { class: "plan__price", text: r.price[lang] })
          );
        })
      )
    ));
  }

  /* ---------- Contact and footer ---------- */

  function copyButton(source, value, label, t) {
    var button = h("button", { type: "button", class: "contact__copy", "aria-label": t["footer.copy"] + " " + label, text: t["footer.copy"] });
    button.addEventListener("click", function () {
      var status = document.getElementById("copy-status");
      function done() {
        button.textContent = t["footer.copied"];
        button.classList.add("is-done");
        if (status) status.textContent = t["footer.copied"] + ": " + value;
        setTimeout(function () {
          button.textContent = t["footer.copy"];
          button.classList.remove("is-done");
          if (status) status.textContent = "";
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
    });
    return button;
  }

  function contactValue(c, className) {
    if (!c.href) return h("span", { class: className, text: c.value });
    var external = c.href.indexOf("http") === 0;
    return h("a", { class: className, href: c.href, target: external ? "_blank" : null, rel: external ? "noopener noreferrer" : null, text: c.value });
  }

  function renderContact(t) {
    var primary = clear(document.getElementById("contact-primary"));
    var list = clear(document.getElementById("contact-list"));
    DATA.contact.forEach(function (c, i) {
      if (i === 0) {
        var email = contactValue(c, "contact__email");
        primary.appendChild(email);
        primary.appendChild(copyButton(email, c.value, c.label, t));
        return;
      }
      var value = contactValue(c, "contact__value");
      list.appendChild(h("li", { class: "contact__row" },
        h("span", { class: "contact__label label", text: c.label }), value, copyButton(value, c.value, c.label, t)
      ));
    });
  }

  function renderFooter(t) {
    var footer = clear(document.getElementById("footer"));
    footer.appendChild(h("p", { class: "footer__brand" }, h("strong", { text: DATA.handle }), " — " + t["footer.built"]));
    footer.appendChild(h("a", { class: "footer__top", href: "#top", text: t["footer.top"] + " ↑" }));
  }

  /* ---------- Lightbox ---------- */

  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.setAttribute("aria-label", alt || DATA.ui[currentLang]["label.enlarge"]);
    if (typeof lightbox.showModal === "function") lightbox.showModal();
  }

  document.getElementById("lightbox-close").addEventListener("click", function () { lightbox.close(); });
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) lightbox.close(); });

  /* ---------- Navigation state ---------- */

  var nav = document.getElementById("nav");
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      nav.classList.toggle("is-solid", window.scrollY > 40);
      ticking = false;
    });
  }, { passive: true });

  /* ---------- Language ---------- */

  function render(lang, isSwitch) {
    var t = DATA.ui[lang];
    currentLang = lang;
    root.lang = lang;
    document.title = DATA.handle + " · " + t["hero.role"].split(" · ")[0];
    document.querySelectorAll(".lang button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === lang));
    });
    renderStatic(t);
    renderHeroWork(lang);
    renderIndex(lang, t);
    renderProjects(lang, t);
    renderExperience(lang, t);
    renderRates(lang, t);
    renderContact(t);
    renderFooter(t);
    observeReveals(isSwitch);
  }

  // Re-renders in place: keeps whatever the reader is looking at in the same spot, plus any open breakdowns.
  function switchLang(lang) {
    var navHeight = nav.getBoundingClientRect().height;
    var key = null;
    var keyTop = 0;
    if (document.querySelector(".hero").getBoundingClientRect().bottom < navHeight) {
      var items = document.querySelectorAll("#project-index, .case[id] > *, .cases__more, #about, #rates, #contact");
      var prev = null;
      for (var i = 0; i < items.length; i++) {
        var r = items[i].getBoundingClientRect();
        if (r.top >= navHeight) {
          var pick = r.top < window.innerHeight ? items[i] : prev;
          if (pick) {
            var owner = pick.parentElement.closest(".case[id]");
            key = owner ? { id: owner.id, index: [].indexOf.call(owner.children, pick) } : { el: pick };
            keyTop = pick.getBoundingClientRect().top;
          }
          break;
        }
        prev = items[i];
      }
    }
    var open = [].map.call(document.querySelectorAll(".more__toggle[aria-expanded='true']"), function (b) {
      return b.getAttribute("aria-controls");
    });

    root.classList.add("no-anim");
    document.querySelector(".hero").classList.add("is-settled");
    render(lang, true);
    open.forEach(function (id) {
      var panel = document.getElementById(id);
      var button = document.querySelector("[aria-controls='" + id + "']");
      if (panel && button) {
        panel.classList.add("is-open");
        panel.inert = false;
        button.setAttribute("aria-expanded", "true");
      }
    });
    if (key) {
      var target = key.el || document.getElementById(key.id).children[key.index];
      if (target) window.scrollBy({ top: target.getBoundingClientRect().top - keyTop, behavior: "instant" });
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.remove("no-anim"); });
    });
  }

  document.querySelectorAll(".lang button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var lang = btn.getAttribute("data-lang");
      if (lang === currentLang) return;
      storeLang(lang);
      switchLang(lang);
    });
  });

  render(detectLang(), false);
})();
