/*
 * Review-only tuner: sliders for the screen background treatment (--aoe-bg-*) and the dialog shade
 * (--dlg-shade-tune), to find the sweet spot per screen theme. Values are kept per data-theme in
 * localStorage and can be copied as JSON to bake into tools/build_tokens.py (HUB_THEMES).
 * Plain script (no module) so it also runs from file:// pages; Alt+T toggles the panel, ?tuner=open opens it.
 */
(function () {
  "use strict";
  if (window.__aoeTuner) return;
  window.__aoeTuner = true;

  var root = document.documentElement;
  var CONTROLS = [
    { group: "Nền màn hình" },
    { v: "--aoe-bg-brightness", label: "Độ sáng", min: 0.3, max: 1.5, step: 0.05, def: 1, fmt: pct },
    { v: "--aoe-bg-contrast", label: "Tương phản", min: 0.5, max: 1.6, step: 0.05, def: 1, fmt: pct },
    { v: "--aoe-bg-saturate", label: "Bão hoà màu", min: 0, max: 2, step: 0.05, def: 1, fmt: pct },
    { v: "--aoe-bg-blur", label: "Làm mờ", min: 0, max: 12, step: 0.5, def: 0, unit: "px", fmt: px },
    { v: "--aoe-bg-scrim", label: "Phủ tối đều", min: 0, max: 0.85, step: 0.01, def: 0, fmt: pct },
    { v: "--aoe-bg-vignette", label: "Tối viền", min: 0, max: 1, step: 0.01, def: 0, fmt: pct },
    { v: "--aoe-bg-x", label: "Khung ngang", min: 0, max: 100, step: 1, def: 50, unit: "%", fmt: posX },
    { v: "--aoe-bg-y", label: "Khung dọc", min: 0, max: 100, step: 1, def: 50, unit: "%", fmt: posY },
    { group: "Hộp thoại" },
    { v: "--dlg-shade-tune", label: "Phủ tối texture", min: 0, max: 0.85, step: 0.01, def: null, fmt: pct, note: "trống = theo theme" },
  ];

  function pct(x) { return Math.round(x * 100) + "%"; }
  function px(x) { return x + "px"; }
  function posX(x) { return x <= 5 ? "trái" : x >= 95 ? "phải" : x + "%"; }
  function posY(x) { return x <= 5 ? "trên" : x >= 95 ? "dưới" : x + "%"; }

  function theme() { return root.dataset.theme || "default"; }
  function key() { return "aoe-tuner:" + theme(); }
  function load() {
    try { return JSON.parse(localStorage.getItem(key()) || "{}"); } catch (e) { return {}; }
  }
  function save(values) {
    try { localStorage.setItem(key(), JSON.stringify(values)); } catch (e) { /* private mode */ }
  }

  // Frame style (data-frame on <html>: "lit" = kiểu A′, "modern" = kiểu B). Pages set it per screen (the hub app:
  // login A′, others B); the tuner only switches it for a quick comparison (not saved). ?frame=game|lit|modern
  // pins one style (the app then leaves it alone).
  function setFrame(style) {
    if (style === "modern" || style === "lit") root.dataset.frame = style;
    else delete root.dataset.frame;
  }
  (function initFrame() {
    var q = new URLSearchParams(location.search).get("frame");
    if (q) setFrame(q);
  })();

  var values = {};
  function apply() {
    CONTROLS.forEach(function (c) {
      if (!c.v) return;
      if (values[c.v] === undefined) root.style.removeProperty(c.v);
      else root.style.setProperty(c.v, values[c.v] + (c.unit || ""));
    });
  }
  /** Value shown on a slider: tuned value, else what the theme sets, else the neutral default. */
  function current(c) {
    if (values[c.v] !== undefined) return values[c.v];
    var themed = parseFloat(getComputedStyle(root).getPropertyValue(c.v));
    if (!isNaN(themed)) return themed;
    if (c.v === "--dlg-shade-tune") {
      var d = parseFloat(getComputedStyle(document.querySelector("[data-dialog-theme]") || root).getPropertyValue("--dlg-shade"));
      return isNaN(d) ? 0.45 : d;
    }
    return c.def;
  }

  // ---- panel
  var css = document.createElement("style");
  css.textContent = [
    // --aoe-tuner-bottom: a page moves the button out of its controls (pages without a review rail).
    ".aoe-tuner{position:fixed;right:12px;bottom:var(--aoe-tuner-bottom,64px);z-index:2147483000;font:12px/1.4 Arimo,Arial,sans-serif;color:#eee}",
    ".aoe-tuner>button{font:600 12px/16px Arimo,Arial,sans-serif;color:#fff;background:#111d;border:1px solid #fff5;padding:2px 10px}",
    ".aoe-tuner .panel{width:300px;max-height:min(80vh,620px);overflow:auto;margin-bottom:6px;padding:10px 12px;background:#0b0907f2;border:1px solid #fff3;box-shadow:0 6px 24px #000a}",
    ".aoe-tuner h4{margin:10px 0 4px;font:600 12px Arimo,Arial,sans-serif;color:#ffd75e;text-transform:uppercase;letter-spacing:.04em}",
    ".aoe-tuner h4:first-child{margin-top:0}",
    ".aoe-tuner .row{display:grid;grid-template-columns:96px 1fr 52px;align-items:center;gap:6px;margin:3px 0}",
    ".aoe-tuner .row output{text-align:right;font-variant-numeric:tabular-nums}",
    ".aoe-tuner .row.changed label{color:#ffd75e}",
    ".aoe-tuner input[type=range]{width:100%}",
    ".aoe-tuner .note{grid-column:2/4;margin-top:-3px;color:#aaa;font-size:11px}",
    ".aoe-tuner .actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}",
    ".aoe-tuner .actions button{font:12px Arimo,Arial,sans-serif;color:#fff;background:#ffffff1f;border:1px solid #fff4;padding:3px 8px}",
    ".aoe-tuner textarea{width:100%;height:96px;margin-top:6px;font:11px Consolas,monospace;color:#ddd;background:#000;border:1px solid #fff3}",
    ".aoe-tuner .theme{color:#aaa;margin-bottom:6px}",
    ".aoe-tuner :focus-visible{outline:1px dashed #ffd75e;outline-offset:2px}",
    // Page with a review rail (#review-rail, hub app): button lowest in the rail's bottom-up stack, open panel on top
    // of the stack (display:contents makes both flex items of the rail; order matches demo/app/ReviewRail.tsx).
    ".aoe-tuner.in-rail{display:contents}",
    ".aoe-tuner.in-rail>button{order:3;white-space:nowrap;background:#000000d9;border-color:#ffffff4d}",
    ".aoe-tuner.in-rail>button:hover{background:#000}",
    ".aoe-tuner.in-rail>button[aria-expanded=true]{color:#ffd75e;border-color:#ffd75e}",
    ".aoe-tuner.in-rail .panel{order:1;margin:0;min-height:0;flex-shrink:1;max-height:none;font:12px/1.4 Arimo,Arial,sans-serif;color:#eee}",
  ].join("\n");
  document.head.appendChild(css);

  var wrap = document.createElement("div");
  wrap.className = "aoe-tuner";
  wrap.innerHTML = '<div class="panel" hidden role="region" aria-label="Chỉnh thông số"></div><button type="button" aria-expanded="false">⚙ Chỉnh thông số</button>';
  var panel = wrap.querySelector(".panel");
  var toggle = wrap.querySelector("button");
  var rows = {};

  function build() {
    panel.innerHTML = '<div class="theme"></div><h4>Kiểu viền</h4><div class="actions frame" role="radiogroup" aria-label="Kiểu viền">' +
      '<button type="button" role="radio" data-frame="game">Game (bevel)</button><button type="button" role="radio" data-frame="lit">Kiểu A′ (sáng trên trái)</button><button type="button" role="radio" data-frame="modern">Kiểu B (khung đều)</button></div>';
    panel.querySelector(".frame").addEventListener("click", function (e) {
      var f = e.target.getAttribute && e.target.getAttribute("data-frame");
      if (f) { setFrame(f); refresh(); }
    });
    CONTROLS.forEach(function (c, i) {
      if (c.group) {
        var h = document.createElement("h4");
        h.textContent = c.group;
        panel.appendChild(h);
        return;
      }
      var row = document.createElement("div");
      row.className = "row";
      var id = "aoe-tuner-" + i;
      row.innerHTML = '<label for="' + id + '"></label><input id="' + id + '" type="range"><output for="' + id + '"></output>' +
        (c.note ? '<span class="note"></span>' : "");
      row.querySelector("label").textContent = c.label;
      if (c.note) row.querySelector(".note").textContent = c.note;
      var input = row.querySelector("input");
      input.min = c.min; input.max = c.max; input.step = c.step;
      input.addEventListener("input", function () {
        values[c.v] = Number(input.value);
        apply(); save(values); refresh();
      });
      input.addEventListener("dblclick", function () { delete values[c.v]; apply(); save(values); refresh(); });
      rows[c.v] = row;
      panel.appendChild(row);
    });
    var actions = document.createElement("div");
    actions.className = "actions";
    actions.innerHTML = '<button type="button" data-a="reset">Về mặc định</button><button type="button" data-a="copy">Chép giá trị</button>';
    panel.appendChild(actions);
    var out = document.createElement("textarea");
    out.readOnly = true;
    out.setAttribute("aria-label", "Giá trị đã chỉnh (JSON)");
    panel.appendChild(out);
    actions.addEventListener("click", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-a");
      if (a === "reset") { values = {}; apply(); save(values); refresh(); }
      if (a === "copy") {
        out.select();
        if (navigator.clipboard) navigator.clipboard.writeText(out.value).catch(function () { document.execCommand("copy"); });
        else document.execCommand("copy");
        e.target.textContent = "Đã chép ✓";
        setTimeout(function () { e.target.textContent = "Chép giá trị"; }, 1200);
      }
    });
  }

  function refresh() {
    panel.querySelectorAll(".frame button").forEach(function (b) {
      var on = (root.dataset.frame || "game") === b.getAttribute("data-frame");
      b.setAttribute("aria-checked", String(on));
      b.style.borderColor = on ? "#ffd75e" : "";
      b.style.color = on ? "#ffd75e" : "";
    });
    panel.querySelector(".theme").textContent = "Theme màn hình: " + theme() + " · nhấp đúp thanh trượt để bỏ chỉnh";
    CONTROLS.forEach(function (c) {
      if (!c.v) return;
      var row = rows[c.v];
      var v = current(c);
      row.querySelector("input").value = v;
      row.querySelector("output").textContent = c.fmt(v);
      row.classList.toggle("changed", values[c.v] !== undefined);
    });
    var tuned = {};
    Object.keys(values).forEach(function (k) { tuned[k] = values[k] + ((CONTROLS.find(function (c) { return c.v === k; }) || {}).unit || ""); });
    panel.querySelector("textarea").value = JSON.stringify({ theme: theme(), values: tuned }, null, 2);
  }

  // Same event as demo/app/ReviewRail.tsx: one review panel open at a time.
  var OPEN_EVENT = "aoe-review-open";
  window.addEventListener(OPEN_EVENT, function (e) { if (e.detail !== "tuner" && !panel.hidden) open(false); });

  function open(show) {
    if (show) window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: "tuner" }));
    panel.hidden = !show;
    toggle.setAttribute("aria-expanded", String(show));
    try { localStorage.setItem("aoe-tuner-open", show ? "1" : "0"); } catch (e) { /* ignore */ }
    if (show) refresh();
  }
  toggle.addEventListener("click", function () { open(panel.hidden); });
  window.addEventListener("keydown", function (e) {
    if (e.altKey && (e.key === "t" || e.key === "T")) { e.preventDefault(); open(panel.hidden); }
    if (e.altKey && (e.key === "b" || e.key === "B")) { e.preventDefault(); setFrame({ game: "lit", lit: "modern", modern: "game" }[root.dataset.frame || "game"]); refresh(); }
  });

  function reloadForTheme() { values = load(); apply(); refresh(); }
  new MutationObserver(reloadForTheme).observe(root, { attributes: true, attributeFilter: ["data-theme", "data-dialog-theme", "data-frame"] });

  function start() {
    var rail = document.getElementById("review-rail");
    if (rail) wrap.classList.add("in-rail");
    (rail || document.body).appendChild(wrap);
    build();
    reloadForTheme();
    var wasOpen = "0";
    try { wasOpen = localStorage.getItem("aoe-tuner-open") || "0"; } catch (e) { /* ignore */ }
    open(wasOpen === "1" || new URLSearchParams(location.search).get("tuner") === "open");
  }
  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
})();
