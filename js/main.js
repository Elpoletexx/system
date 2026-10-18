(function () {
  "use strict";

  var DATA = window.PORTFOLIO;
  var LANGS = ["ca", "es", "en"];
  var STORAGE_KEY = "plvz03-lang";

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

  function detailItem(item) {
    if (Array.isArray(item)) {
      return h("li", null, h("strong", { text: item[0] }), " " + item[1]);
    }
    return h("li", { text: item });
  }

  function renderStatic(t) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var value = t[el.getAttribute("data-i18n")];
      if (typeof value === "string") el.textContent = value;
    });

    var facts = clear(document.getElementById("facts"));
    t.facts.forEach(function (pair) {
      facts.appendChild(h("div", { class: "facts__item" }, h("dt", { text: pair[0] }), h("dd", { text: pair[1] })));
    });

    var checks = clear(document.getElementById("verdict-checks"));
    t["panel.checks"].forEach(function (label, i) {
      checks.appendChild(h("li", { style: "--i:" + i, text: label }));
    });

    var skills = clear(document.getElementById("skills"));
    t["skills.items"].forEach(function (pair) {
      skills.appendChild(h("li", { class: "skill" }, h("h3", { text: pair[0] }), h("p", { text: pair[1] })));
    });

    document.getElementById("stack").textContent = DATA.stack.join(" · ");
  }

  function renderProjects(lang, t) {
    var list = clear(document.getElementById("project-list"));
    DATA.projects.forEach(function (p) {
      var c = p[lang];
      var main = p.images[0];
      var media = h("div", { class: "project__media" + (p.fit === "contain" ? " project__media--contain" : "") },
        h("img", { src: main.src, width: main.w, height: main.h, alt: c.alt, loading: "lazy", decoding: "async" }),
        p.images[1] ? h("img", {
          class: "project__extra", src: p.images[1].src, width: p.images[1].w, height: p.images[1].h,
          alt: c.altExtra || "", loading: "lazy", decoding: "async"
        }) : null
      );

      var meta = h("p", { class: "project__meta" },
        h("span", { class: "status status--" + p.tone, text: c.status }),
        h("span", { class: "project__years", text: p.years })
      );

      var role = h("p", { class: "project__role" },
        h("span", { class: "label", text: t["label.role"] }), " " + c.role,
        p.developer ? h("span", { class: "project__dev" }, h("span", { class: "label", text: t["label.developer"] }), " " + p.developer) : null
      );

      var details = null;
      if (c.details && c.details.length) {
        details = h("details", { class: "project__details" },
          h("summary", { text: t["label.more"] }),
          h("div", { class: "project__groups" }, c.details.map(function (group) {
            return h("div", { class: "group" }, h("h4", { text: group.title }), h("ul", null, group.items.map(detailItem)));
          }))
        );
      }

      list.appendChild(h("article", { class: "project", id: p.id },
        media,
        h("div", { class: "project__body" },
          meta,
          h("h3", { class: "project__title", text: c.title }),
          role,
          h("ul", { class: "tags" }, c.tags.map(function (tag) { return h("li", { text: tag }); })),
          h("p", { class: "project__summary", text: c.summary }),
          h("ul", { class: "highlights" }, c.highlights.map(function (item) { return h("li", { text: item }); })),
          details
        )
      ));
    });
  }

  function renderExperience(lang, t) {
    var body = document.getElementById("experience-body");
    body.querySelectorAll(".job").forEach(function (el) { el.remove(); });

    DATA.experience.forEach(function (job) {
      var c = job[lang];
      body.appendChild(h("article", { class: "job", id: job.id },
        h("div", { class: "job__intro" },
          h("div", { class: "job__text" },
            h("p", { class: "project__meta" },
              h("span", { class: "status status--live", text: c.period }),
              h("span", { class: "project__years", text: c.clientLabel + ": " + job.client })
            ),
            h("h3", { class: "job__title", text: c.title }),
            h("p", { class: "job__role", text: c.role }),
            h("p", { class: "job__summary", text: c.summary })
          ),
          h("img", { class: "job__image", src: job.image.src, width: job.image.w, height: job.image.h, alt: c.alt, loading: "lazy", decoding: "async" })
        ),
        h("h4", { class: "subhead", text: t["experience.systems"] }),
        h("ul", { class: "systems" }, c.systems.map(function (pair) {
          return h("li", { class: "system" }, h("h5", { text: pair[0] }), h("p", { text: pair[1] }));
        })),
        h("div", { class: "job__columns" },
          h("div", { class: "bugs" },
            h("h4", { class: "subhead", text: t["experience.bugs"] }),
            h("p", { class: "muted", text: t["experience.bugsIntro"] }),
            h("ul", { class: "bugs__list" }, c.bugs.map(function (bug) { return h("li", { text: bug }); }))
          ),
          h("div", { class: "process" },
            h("h4", { class: "subhead", text: t["experience.process"] }),
            h("ol", { class: "process__list" }, c.process.map(function (step) { return h("li", { text: step }); })),
            h("p", { class: "muted", text: t["experience.processOutro"] })
          )
        )
      ));
    });
  }

  function renderRates(lang, t) {
    var body = clear(document.getElementById("rates-body"));

    body.appendChild(h("div", { class: "rate-card" },
      h("h3", { class: "rate-card__title", text: t["rates.perTask"] }),
      h("dl", { class: "rate-list" }, DATA.rates.perTask.map(function (r) {
        return h("div", { class: "rate-list__row" }, h("dt", { text: r.method }), h("dd", { text: r.amount }));
      }))
    ));

    body.appendChild(h("div", { class: "rate-card" },
      h("h3", { class: "rate-card__title", text: t["rates.longTerm"] }),
      h("div", { class: "table-scroll" },
        h("table", { class: "rate-table" },
          h("thead", null, h("tr", null,
            h("th", { scope: "col", text: t["rates.plan"] }),
            h("th", { scope: "col", class: "num", text: t["rates.hours"] }),
            h("th", { scope: "col", class: "num", text: t["rates.monthly"] })
          )),
          h("tbody", null, DATA.rates.longTerm.map(function (r) {
            return h("tr", null,
              h("th", { scope: "row", text: r[lang] }),
              h("td", { class: "num", text: String(r.hours) }),
              h("td", { class: "num", text: r.price })
            );
          }))
        )
      )
    ));
  }

  function copyText(button, value, t) {
    function done() {
      button.textContent = t["footer.copied"];
      setTimeout(function () { button.textContent = t["footer.copy"]; }, 1600);
    }
    function selectFallback() {
      var target = button.previousElementSibling;
      var range = document.createRange();
      range.selectNodeContents(target);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done, selectFallback);
    } else {
      selectFallback();
    }
  }

  function renderFooter(t) {
    var footer = clear(document.getElementById("footer"));
    footer.appendChild(h("div", { class: "footer__block" },
      h("p", { class: "label", text: t["footer.languages"] }),
      h("p", { text: DATA.languagesSpoken.join(" · ") })
    ));

    if (DATA.contact && DATA.contact.length) {
      footer.appendChild(h("div", { class: "footer__block" },
        h("p", { class: "label", text: t["footer.contact"] }),
        h("ul", { class: "contact" }, DATA.contact.map(function (c) {
          var value = c.href
            ? h("a", { href: c.href, target: "_blank", rel: "noopener noreferrer", class: "contact__value", text: c.value })
            : h("span", { class: "contact__value", text: c.value });
          var copy = h("button", { type: "button", class: "contact__copy", text: t["footer.copy"] });
          copy.addEventListener("click", function () { copyText(copy, c.value, t); });
          return h("li", null, h("span", { class: "contact__label", text: c.label }), value, copy);
        }))
      ));
    }

    footer.appendChild(h("p", { class: "footer__sig" }, h("strong", { text: DATA.handle }), " · " + t["footer.built"]));
  }

  function render(lang) {
    var t = DATA.ui[lang];
    document.documentElement.lang = lang;
    document.querySelectorAll(".lang button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === lang));
    });
    renderStatic(t);
    renderProjects(lang, t);
    renderExperience(lang, t);
    renderRates(lang, t);
    renderFooter(t);
  }

  document.querySelectorAll(".lang button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var lang = btn.getAttribute("data-lang");
      storeLang(lang);
      render(lang);
    });
  });

  render(detectLang());
})();
