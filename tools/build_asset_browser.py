"""Generate demo/asset-browser/index.html, a browser for the hub's asset library.

Default view: curated assets from assets/ui/index.json, grouped the way the hub uses
them (backgrounds, dialog textures, theme controls, faction HUD, icons, cursors, fonts),
with the default theme marked and a detail panel (path, source id, frames).
Secondary view: every decoded SLP in raw/ (for research), grouped by DRS archive.

Standalone HTML: data is embedded, works from file:// without a server.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Any

from PIL import Image

SECTIONS = [
    ("background", "Nền màn hình", "Mỗi theme giữ 1 bản gốc (2560) + bản 1920 thu nhỏ từ bản gốc. Chỉ thu nhỏ, không phóng to."),
    ("dialog", "Texture hộp thoại", "Lát nền cho Panel / Dialog. Không có viền — viền do Bevel vẽ."),
    ("button", "Control theo theme", "Checkbox, nút đóng, mũi tên, ô trống. Mỗi control 2 trạng thái: thường / nhấn (rê chuột để xem)."),
    ("hud", "HUD theo phe", "5 phong cách. Thanh HUD không scale: thanh trên neo trái, thanh dưới ghép 2 lớp (ô minimap 280px neo phải)."),
    ("icon", "Icon", "Tài nguyên, lính, công nghệ, công trình theo phong cách, chữ số."),
    ("fx", "Hiệu ứng", "Animation nhỏ trong trận."),
    ("minimap", "Minimap", "Nền hình thoi của bản đồ nhỏ."),
    ("cursor", "Con trỏ", "Rê chuột lên ô để thử con trỏ thật (.cur)."),
    ("font", "Font", "Hub dùng Spectral SC + Arimo. Font game (TCVN3 / Latin-1) chỉ để tham khảo."),
]
DEFAULT_THEMES = {"scr2", "dlg6_0"}
STYLE_ORDER = ["egyptian", "greek", "babylonian", "asian", "roman"]
STYLE_LABELS = {"egyptian": "Ai Cập", "greek": "Hy Lạp", "babylonian": "Babylon", "asian": "Á Đông", "roman": "La Mã"}
CONTROL_ORDER = ["checkbox-off", "checkbox-on", "close", "arrow-up", "arrow-down", "arrow-down-alt", "blank", "blank-alt"]


def image_size(path: Path) -> tuple[int, int] | None:
    try:
        with Image.open(path) as im:
            return im.width, im.height
    except Exception:
        return None


def theme_sort_key(theme: str) -> tuple[int, int, str]:
    if theme.startswith("scr"):
        return (0, int(theme[3:]), theme)
    if theme.startswith("dlg6_"):
        return (1, int(theme[5:]), theme)
    return (2, 0, theme)


def build_curated(assets_dir: Path) -> list[dict[str, Any]]:
    index = json.loads((assets_dir / "index.json").read_text(encoding="utf-8"))
    items: list[dict[str, Any]] = []
    for key, a in index["assets"].items():
        item = dict(a)
        cat = a["category"]
        path = assets_dir / a["path"]
        if path.suffix.lower() in (".png", ".webp") and "width" not in item:
            size = image_size(path)
            if size:
                item["width"], item["height"] = size
        if a.get("json"):
            meta = json.loads((assets_dir / a["json"]).read_text(encoding="utf-8"))
            item["frames"] = [
                {k: f[k] for k in ("x", "y", "width", "height")} for f in meta.get("frames", [])
            ]
            item["sheetWidth"], item["sheetHeight"] = meta.get("sheet_width"), meta.get("sheet_height")

        # Display grouping inside a section
        if cat == "background":
            item["group"] = item.get("theme", "")
            item["variant"] = "master" if key == f"bg/{item.get('theme')}" else "derived"
        elif cat == "button":
            item["group"] = item.get("theme", "")
        elif cat == "hud":
            item["group"] = item.get("style") or next((s for s in STYLE_ORDER if key.startswith(f"hud/{s}-")), "other")
        elif cat == "icon":
            item["group"] = next((s for s in STYLE_ORDER if key.startswith(f"icon/{s}-")), "common")
        elif cat == "font":
            item["group"] = "hub" if "/web/" in key else "game"
        else:
            item["group"] = ""
        theme = item.get("theme") or ""
        item["isDefault"] = theme in DEFAULT_THEMES or key.startswith("dialog/dlg6_0") or key == "cursor/theme-scr2"
        items.append(item)
    return items


def build_raw(raw_dir: Path) -> list[dict[str, Any]]:
    manifest = raw_dir / "slp_manifest.json"
    rows: list[dict[str, Any]] = []
    if manifest.is_file():
        for e in json.loads(manifest.read_text(encoding="utf-8")):
            multi = e["num_frames"] > 1
            rows.append({
                "id": e["id"],
                "drs": e["drs"],
                "frames": e["num_frames"],
                "palette": e["palette_id"],
                "width": e.get("sheet_width") if multi else e.get("width"),
                "height": e.get("sheet_height") if multi else e.get("height"),
                "png": e["sheet_png"] if multi else e["png"],
            })
    for bmp in sorted(raw_dir.glob("*/*.bmp")):
        size = image_size(bmp) or (0, 0)
        rows.append({"id": int(bmp.stem), "drs": bmp.parent.name, "frames": 1, "palette": "BMP",
                     "width": size[0], "height": size[1], "png": f"{bmp.parent.name}/{bmp.name}"})
    rows.sort(key=lambda r: (r["drs"], r["id"]))
    return rows


PAGE = r"""<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AoE Asset Library</title>
<style>
@font-face { font-family: "Spectral SC"; font-weight: 400; src: url("../../assets/ui/font/web/SpectralSC-400.ttf"); }
@font-face { font-family: "Spectral SC"; font-weight: 600; src: url("../../assets/ui/font/web/SpectralSC-600.ttf"); }
@font-face { font-family: "Arimo"; font-weight: 400; src: url("../../assets/ui/font/web/Arimo-400.ttf"); }
@font-face { font-family: "Arimo"; font-weight: 700; src: url("../../assets/ui/font/web/Arimo-700.ttf"); }
:root {
  color-scheme: dark;
  --bg: #15110c; --panel: #201a13; --panel-2: #2a2219; --line: #3b3024;
  --text: #d9d0b0; --muted: #8f8670; --focus: #cacf01; --accent: #e3ab7f;
  --bevel: inset 1px 1px 0 #733b00, inset -1px -1px 0 #2c1806, inset 2px 2px 0 #3b1a03, inset -2px -2px 0 #3b0d02;
  --checker: repeating-conic-gradient(#2a2420 0% 25%, #221d19 0% 50%) 50% / 16px 16px;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.45 Arimo, Arial, sans-serif; }
h1, h2, h3, .sc { font-family: "Spectral SC", serif; font-weight: 600; }
header { position: sticky; top: 0; z-index: 10; background: rgba(21,17,12,.96); border-bottom: 1px solid var(--line); padding: 12px 20px; }
.top { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
h1 { margin: 0; font-size: 22px; color: var(--accent); }
.count { color: var(--muted); font-size: 12px; }
.tabs { display: flex; gap: 4px; margin-left: auto; }
.tab { font: 600 14px "Spectral SC", serif; color: var(--text); background: var(--panel); border: 0; padding: 6px 14px; cursor: pointer; box-shadow: var(--bevel); }
.tab[aria-selected="true"] { color: #fff; background: #3b2a1a; box-shadow: inset 1px 1px 0 #2c1806, inset -1px -1px 0 #733b00; }
.bar { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; align-items: center; }
input[type=search] { flex: 1 1 260px; min-width: 200px; font: inherit; color: var(--text); background: #0f0c08; border: 0; padding: 7px 10px; box-shadow: inset 1px 1px 0 #2c1806, inset -1px -1px 0 #733b00; }
input[type=search]:focus { outline: 1px dashed var(--focus); outline-offset: -4px; }
.chip { font: 12px Arimo, sans-serif; color: var(--text); background: var(--panel); border: 1px solid var(--line); padding: 4px 10px; cursor: pointer; }
.chip[aria-pressed="true"] { border-color: var(--accent); color: #fff; background: #3b2a1a; }
main { padding: 8px 20px 60px; max-width: 1500px; margin: 0 auto; }
section.sec { margin-top: 26px; }
.sec > h2 { margin: 0; font-size: 20px; display: flex; gap: 10px; align-items: baseline; }
.sec > h2 small { font: 12px Arimo, sans-serif; color: var(--muted); }
.sec > p { margin: 2px 0 10px; color: var(--muted); font-size: 13px; }
.group { margin: 12px 0 4px; }
.group > h3 { margin: 0 0 6px; font-size: 15px; display: flex; gap: 8px; align-items: center; }
.grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(var(--min, 180px), 1fr)); }
.card { background: var(--panel); cursor: pointer; display: flex; flex-direction: column; min-width: 0; box-shadow: var(--bevel); }
.card:hover { background: var(--panel-2); }
.card:hover .name { color: var(--focus); }
.card:focus-visible { outline: 1px dashed var(--focus); outline-offset: -5px; }
.thumb { height: var(--thumb, 120px); display: flex; align-items: center; justify-content: center; background: var(--checker); overflow: hidden; position: relative; }
.thumb img { max-width: 100%; max-height: 100%; }
.pixel img, img.pixel { image-rendering: pixelated; }
.meta { padding: 7px 9px 8px; font-size: 12px; }
.name { font-family: "Spectral SC", serif; font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sub { color: var(--muted); display: flex; justify-content: space-between; gap: 8px; }
.badge { font: 600 11px Arimo, sans-serif; padding: 1px 6px; background: #0b4d1f; color: #d7ffd9; }
.badge.warn { background: #5a3d06; color: #ffe2a8; }
.controls { display: flex; flex-wrap: wrap; gap: 6px; }
.ctl { width: 64px; text-align: center; font-size: 10px; color: var(--muted); cursor: pointer; }
.ctl .box { width: 64px; height: 64px; background: var(--checker); display: flex; align-items: center; justify-content: center; }
.ctl img { width: 48px; height: 48px; image-rendering: pixelated; }
.ctl .pressed { display: none; }
.ctl:hover .normal { display: none; } .ctl:hover .pressed { display: block; }
.ctlrow { display: flex; gap: 12px; align-items: center; background: var(--panel); padding: 8px 10px; margin-bottom: 6px; box-shadow: var(--bevel); }
.ctlrow .label { width: 110px; flex: none; }
.hudtop { height: 20px; background-repeat: no-repeat; background-position: left top; }
.hudbottom { position: relative; height: 126px; background-repeat: no-repeat; background-position: left top; overflow: hidden; }
.hudcap { position: absolute; right: 0; top: 0; width: 280px; height: 126px; background-repeat: no-repeat; background-position: right top; }
.hudrow { background: var(--panel); padding: 8px; margin-bottom: 10px; box-shadow: var(--bevel); }
.hudrow .parts { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
.texture { width: 100%; height: 100%; background-repeat: repeat; image-rendering: pixelated; }
.specimen { padding: 10px 12px; text-align: left; width: 100%; color: var(--text); }
.specimen .big { font-size: 26px; line-height: 1.2; }
.cursor-tile .thumb { cursor: var(--cur); }
.empty { color: var(--muted); padding: 30px 0; text-align: center; }
/* raw view */
.drs { margin-top: 22px; }
.rawgrid { --min: 130px; --thumb: 80px; }
.rawgrid .name { font: 12px Arimo, sans-serif; }
/* detail */
dialog { border: 0; padding: 0; background: var(--panel); color: var(--text); width: min(1100px, 94vw); max-height: 92vh; box-shadow: inset 2px 2px 0 #733b00, inset -2px -2px 0 #2c1806, 0 10px 40px #000; }
dialog::backdrop { background: rgba(0,0,0,.7); }
.dlg-head { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--line); }
.dlg-head h2 { margin: 0; font-size: 18px; flex: 1; }
.dlg-body { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 16px; padding: 16px; overflow: auto; max-height: calc(92vh - 60px); }
.stage { background: var(--checker); min-height: 260px; display: flex; align-items: center; justify-content: center; overflow: auto; padding: 10px; }
.stage img { max-width: 100%; }
.info { font-size: 13px; }
.info dt { color: var(--muted); font-size: 11px; margin-top: 8px; }
.info dd { margin: 0; word-break: break-all; }
.copy { font: 12px Arimo, sans-serif; margin-top: 4px; color: var(--text); background: #3b2a1a; border: 0; padding: 3px 8px; cursor: pointer; }
.frames { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px; max-height: 260px; overflow: auto; }
.frame { background-color: #221d19; background-repeat: no-repeat; outline: 1px solid var(--line); cursor: pointer; image-rendering: pixelated; }
.frame.on { outline: 2px solid var(--focus); }
.x { font: 600 18px Arimo, sans-serif; background: none; border: 0; color: var(--text); cursor: pointer; padding: 0 6px; }
@media (max-width: 760px) { .dlg-body { grid-template-columns: 1fr; } header { padding: 10px 12px; } main { padding: 6px 12px 40px; } }
</style>
</head>
<body>
<header>
  <div class="top">
    <h1>AoE Asset Library</h1>
    <span class="count" id="count"></span>
    <div class="tabs" role="tablist">
      <button class="tab" role="tab" id="tab-lib" aria-selected="true">Thư viện hub</button>
      <button class="tab" role="tab" id="tab-raw" aria-selected="false">Dữ liệu gốc (raw)</button>
    </div>
  </div>
  <div class="bar">
    <input type="search" id="q" placeholder="Tìm theo tên, id gốc (vd 50601), mô tả…" aria-label="Tìm asset">
    <span id="chips"></span>
  </div>
</header>
<main id="main"></main>
<dialog id="dlg" aria-labelledby="dlg-title">
  <div class="dlg-head"><h2 id="dlg-title"></h2><button class="x" id="dlg-x" aria-label="Đóng">✕</button></div>
  <div class="dlg-body"><div><div class="stage" id="dlg-stage"></div><div class="frames" id="dlg-frames"></div></div><dl class="info" id="dlg-info"></dl></div>
</dialog>
<script>
const DATA = __DATA__;
const A = "../../assets/ui/", R = "../../raw/";
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const state = { view: "lib", q: "", section: "all" };
const byKey = Object.fromEntries(DATA.curated.map(a => [a.key, a]));

function matches(a) {
  if (!state.q) return true;
  const hay = [a.key, a.description, a.original_id, a.theme, a.style, a.control, a.group].join(" ").toLowerCase();
  return state.q.split(/\s+/).every(t => hay.includes(t));
}
function fontFaces() {
  const css = DATA.curated.filter(a => a.category === "font" && a.path.endsWith(".ttf"))
    .map(a => `@font-face{font-family:"f-${a.key.replace(/\W/g, "-")}";src:url("${A}${a.path}")}`).join("");
  const st = document.createElement("style"); st.textContent = css; document.head.append(st);
}
const defBadge = a => a.isDefault ? '<span class="badge">Mặc định</span>' : "";
const dims = a => a.width ? `${a.width}×${a.height}` : "";

function card(a, preview, opts = {}) {
  return `<div class="card ${opts.cls || ""}" tabindex="0" data-key="${esc(a.key)}" style="${opts.style || ""}">
    <div class="thumb ${opts.pixel ? "pixel" : ""}">${preview}</div>
    <div class="meta"><div class="name" title="${esc(a.key)}">${esc(opts.title || a.key.split("/").slice(1).join("/"))}</div>
    <div class="sub"><span>${esc(opts.note || ("#" + a.original_id))}</span><span>${defBadge(a)} ${esc(opts.dims ?? dims(a))}</span></div></div></div>`;
}
// Small pixel art is shown at 2x (integer scale keeps it crisp).
const img = (a, cls = "") => `<img loading="lazy" class="${cls}" src="${A}${esc(a.path)}" alt=""${a.width && a.width <= 64 ? ` style="width:${a.width * 2}px"` : ""}>`;
const themeRank = t => /^scr(\d+)$/.test(t) ? +t.slice(3) : /^dlg6_(\d+)$/.test(t) ? 100 + +t.slice(5) : 200;

const renderers = {
  background(items) {
    const themes = [...new Set(items.map(a => a.theme))];
    return `<div class="grid" style="--min:260px;--thumb:150px">${themes.map(t => {
      const m = items.find(a => a.theme === t && a.variant === "master") || items.find(a => a.theme === t);
      const others = items.filter(a => a.theme === t && a !== m).map(a => dims(a)).join(", ");
      return card(m, `<img loading="lazy" src="${A}${esc(m.path)}" alt="" style="width:100%;height:100%;object-fit:cover">`,
        { title: t, note: others ? `+ ${others}` : "bản duy nhất" });
    }).join("")}</div>`;
  },
  dialog(items) {
    return `<div class="grid" style="--min:200px;--thumb:110px">${items.map(a =>
      card(a, `<div class="texture" style="background-image:url('${A}${esc(a.path)}')"></div>`)).join("")}</div>`;
  },
  button(items) {
    const themes = [...new Set(items.map(a => a.theme))].sort((x, y) => themeRank(x) - themeRank(y));
    return themes.map(t => {
      const tItems = items.filter(a => a.theme === t);
      const ctl = CONTROL_ORDER.map(c => {
        const n = tItems.find(a => a.control === c && a.state === "normal"), p = tItems.find(a => a.control === c && a.state === "pressed");
        if (!n) return "";
        return `<div class="ctl" tabindex="0" data-key="${esc(n.key)}" title="${esc(n.key)}"><div class="box">
          <img class="normal" src="${A}${esc(n.path)}" alt=""><img class="pressed" src="${A}${esc((p || n).path)}" alt=""></div>${esc(c)}</div>`;
      }).join("");
      const extras = tItems.filter(a => a.control === "extra").map(a =>
        `<div class="ctl" tabindex="0" data-key="${esc(a.key)}"><div class="box"><img src="${A}${esc(a.path)}" alt="" style="width:auto;height:auto;max-width:48px"></div>phụ</div>`).join("");
      const sheet = tItems.find(a => a.key.endsWith("-sheet"));
      return `<div class="ctlrow"><div class="label"><div class="sc">${esc(t)}</div>${tItems[0]?.isDefault ? '<span class="badge">Mặc định</span>' : ""}
        ${sheet ? `<div class="count">#${sheet.original_id}</div>` : ""}</div><div class="controls">${ctl}${extras}</div></div>`;
    }).join("");
  },
  hud(items) {
    const styles = STYLE_ORDER.filter(s => items.some(a => a.group === s));
    const rows = styles.map(s => {
      const g = items.filter(a => a.group === s);
      const top = g.find(a => a.key.endsWith("-topbar")), bot = g.find(a => a.key.endsWith("-bottombar"));
      const parts = g.filter(a => a !== top && a !== bot);
      return `<div class="hudrow"><div class="group"><h3>${esc(STYLE_LABELS[s])} <span class="count">${esc(s)}</span></h3></div>
        ${top ? `<div class="hudtop" data-key="${esc(top.key)}" style="background-image:url('${A}${esc(top.path)}')"></div>` : ""}
        ${bot ? `<div class="hudbottom" data-key="${esc(bot.key)}" style="background-image:url('${A}${esc(bot.path)}')"><div class="hudcap" style="background-image:url('${A}${esc(bot.path)}')"></div></div>` : ""}
        <div class="parts">${parts.map(a => card(a, img(a), { pixel: true, title: a.key.replace(`hud/${s}-`, ""), style: "width:200px;--thumb:90px" })).join("")}</div></div>`;
    }).join("");
    const other = items.filter(a => !STYLE_ORDER.includes(a.group));
    return rows + (other.length ? `<div class="group"><h3>Dùng chung</h3></div><div class="grid" style="--min:220px;--thumb:90px">${other.map(a => card(a, img(a), { pixel: true })).join("")}</div>` : "");
  },
  icon(items) {
    const common = items.filter(a => a.group === "common"), styled = items.filter(a => a.group !== "common");
    const grid = list => `<div class="grid" style="--min:240px;--thumb:130px">${list.map(a => card(a, img(a), { pixel: true, dims: a.frames ? `${a.frames.length} frame` : dims(a) })).join("")}</div>`;
    return `<div class="group"><h3>Dùng chung</h3></div>${grid(common)}<div class="group"><h3>Công trình theo phong cách</h3></div>${grid(styled)}`;
  },
  fx: items => `<div class="grid" style="--min:220px">${items.map(a => card(a, img(a), { pixel: true, dims: a.frames ? `${a.frames.length} frame` : "" })).join("")}</div>`,
  minimap: items => `<div class="grid" style="--min:240px;--thumb:140px">${items.map(a => card(a, img(a))).join("")}</div>`,
  cursor(items) {
    return `<div class="grid" style="--min:120px;--thumb:80px">${items.map(a => card(a, img(a), {
      pixel: true, cls: "cursor-tile", style: `--cur:url('${A}${esc(a.cur_path || a.path)}') ${a.hotspot_x || 0} ${a.hotspot_y || 0}, auto` })).join("")}</div>`;
  },
  font(items) {
    const block = (title, list) => `<div class="group"><h3>${title}</h3></div><div class="grid" style="--min:320px;--thumb:auto">${list.map(a =>
      card(a, `<div class="specimen" style="font-family:'f-${a.key.replace(/\W/g, "-")}'"><div class="big">Sảnh chờ · Đội Hy Lạp</div>Người chơi đã sẵn sàng — ẤẦẨẪẬ 0123</div>`,
        { title: a.path.split("/").pop(), note: a.description, dims: "" })).join("")}</div>`;
    return block("Font của hub", items.filter(a => a.group === "hub")) + block("Font gốc của game (không dùng — thiếu Unicode tiếng Việt)", items.filter(a => a.group === "game"));
  },
};
const STYLE_ORDER = DATA.styleOrder, STYLE_LABELS = DATA.styleLabels, CONTROL_ORDER = DATA.controlOrder;

function renderLib() {
  let total = 0;
  const html = DATA.sections.filter(([id]) => state.section === "all" || state.section === id).map(([id, title, desc]) => {
    const items = DATA.curated.filter(a => a.category === id && matches(a));
    total += items.length;
    if (!items.length) return "";
    return `<section class="sec" id="sec-${id}"><h2>${esc(title)} <small>${items.length} asset</small></h2><p>${esc(desc)}</p>${renderers[id](items)}</section>`;
  }).join("");
  $("#main").innerHTML = html || '<div class="empty">Không có asset khớp tìm kiếm.</div>';
  $("#count").textContent = `${total} / ${DATA.curated.length} asset trong assets/ui`;
}
function renderRaw() {
  const rows = DATA.raw.filter(r => !state.q || `${r.id} ${r.drs} ${r.palette}`.toLowerCase().includes(state.q));
  const drs = [...new Set(rows.map(r => r.drs))];
  $("#main").innerHTML = `<p class="count" style="margin-top:14px">Mọi SLP đã giải mã trong raw/ (kể cả các độ phân giải đã gom). Dùng để tra cứu; UI chỉ dùng thư viện hub.</p>` +
    drs.map(d => `<section class="drs"><h2 class="sc" style="margin:0 0 8px;font-size:18px">${esc(d)}.drs <small class="count">${rows.filter(r => r.drs === d).length}</small></h2>
    <div class="grid rawgrid">${rows.filter(r => r.drs === d).map(r => `<div class="card" title="#${r.id}">
      <div class="thumb pixel"><img loading="lazy" src="${R}${esc(r.png)}" alt=""></div>
      <div class="meta"><div class="name">#${r.id}</div><div class="sub"><span>${r.frames > 1 ? r.frames + " frame" : esc(r.width + "×" + r.height)}</span><span>pal ${esc(r.palette)}</span></div></div></div>`).join("")}</div></section>`).join("");
  $("#count").textContent = `${rows.length} / ${DATA.raw.length} ảnh thô`;
}
function renderChips() {
  const chips = state.view === "lib" ? [["all", "Tất cả"], ...DATA.sections.map(([id, t]) => [id, t])] : [];
  $("#chips").innerHTML = chips.map(([id, t]) => `<button class="chip" data-sec="${id}" aria-pressed="${state.section === id}">${esc(t)}</button>`).join(" ");
}
function render() { renderChips(); state.view === "lib" ? renderLib() : renderRaw(); }

function openDetail(key) {
  const a = byKey[key]; if (!a) return;
  $("#dlg-title").textContent = a.key;
  const stage = $("#dlg-stage"), framesEl = $("#dlg-frames");
  const isFont = a.path.endsWith(".ttf"), isImg = /\.(png|webp|bmp)$/.test(a.path);
  stage.innerHTML = isFont
    ? `<div class="specimen" style="font-family:'f-${a.key.replace(/\W/g, "-")}'"><div class="big">Sảnh chờ — Vào phòng</div><div class="big">ĐỘI HY LẠP · ƯU TIÊN</div>Người chơi đã sẵn sàng. 0123456789</div>`
    : a.category === "dialog" ? `<div class="texture" style="height:300px;background-image:url('${A}${esc(a.path)}')"></div>`
    : isImg ? `<img class="${(a.width || 999) < 400 ? "pixel" : ""}" src="${A}${esc(a.path)}" alt="" style="${(a.width || 999) < 200 ? "width:" + (a.width * 3) + "px" : ""}">` : "";
  framesEl.innerHTML = "";
  if (a.frames && a.frames.length > 1) {
    const scale = Math.min(2, 96 / Math.max(...a.frames.map(f => f.height)));
    framesEl.innerHTML = a.frames.map((f, i) => `<div class="frame" data-i="${i}" title="frame ${i}" style="width:${f.width * scale}px;height:${f.height * scale}px;background-image:url('${A}${esc(a.path)}');background-size:${a.sheetWidth * scale}px ${a.sheetHeight * scale}px;background-position:-${f.x * scale}px -${f.y * scale}px"></div>`).join("");
    framesEl.onclick = e => { const el = e.target.closest(".frame"); if (!el) return; framesEl.querySelectorAll(".on").forEach(x => x.classList.remove("on")); el.classList.add("on");
      const f = a.frames[+el.dataset.i], s = Math.min(4, 240 / f.height);
      stage.innerHTML = `<div class="frame" style="width:${f.width * s}px;height:${f.height * s}px;background-image:url('${A}${esc(a.path)}');background-size:${a.sheetWidth * s}px ${a.sheetHeight * s}px;background-position:-${f.x * s}px -${f.y * s}px"></div>`; };
  }
  const fields = [["Đường dẫn", "assets/ui/" + a.path, true], ["Mô tả", a.description], ["Id gốc", a.original_id ? `#${a.original_id} (${a.original_drs})` : a.original_drs],
    ["Kích thước", dims(a)], ["Frame", a.frames ? a.frames.length : ""], ["Theme / phong cách", a.theme || a.style || ""], ["Control", a.control ? `${a.control} · ${a.state || ""}` : ""],
    ["File toạ độ frame", a.json ? "assets/ui/" + a.json : "", true], ["Con trỏ (.cur)", a.cur_path ? "assets/ui/" + a.cur_path : "", true],
    ["Cách đặt (slice)", a.slice ? JSON.stringify(a.slice) : ""], ["Giấy phép", a.license ? "assets/ui/" + a.license : ""]];
  $("#dlg-info").innerHTML = (a.isDefault ? '<span class="badge">Theme mặc định</span>' : "") + fields.filter(f => f[1] !== "" && f[1] != null).map(([k, v, c]) =>
    `<dt>${esc(k)}</dt><dd>${esc(v)}${c ? ` <button class="copy" data-copy="${esc(v)}">Chép</button>` : ""}</dd>`).join("");
  $("#dlg").showModal();
}

document.addEventListener("click", e => {
  const chip = e.target.closest(".chip"); if (chip) { state.section = chip.dataset.sec; render(); return; }
  const cp = e.target.closest(".copy"); if (cp) { navigator.clipboard?.writeText(cp.dataset.copy); cp.textContent = "Đã chép"; return; }
  const k = e.target.closest("[data-key]"); if (k && state.view === "lib") openDetail(k.dataset.key);
});
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.dataset?.key) openDetail(e.target.dataset.key); });
$("#dlg-x").onclick = () => $("#dlg").close();
$("#dlg").addEventListener("click", e => { if (e.target === $("#dlg")) $("#dlg").close(); });
$("#q").addEventListener("input", e => { state.q = e.target.value.trim().toLowerCase(); render(); });
for (const [id, view] of [["tab-lib", "lib"], ["tab-raw", "raw"]]) $("#" + id).onclick = () => {
  state.view = view; $("#tab-lib").setAttribute("aria-selected", view === "lib"); $("#tab-raw").setAttribute("aria-selected", view === "raw"); render(); };
fontFaces(); render();
</script>
</body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the asset library browser page.")
    parser.add_argument("--raw-dir", default="raw")
    parser.add_argument("--assets-dir", default="assets/ui")
    parser.add_argument("--out", default="demo/asset-browser/index.html")
    args = parser.parse_args()

    assets_dir, raw_dir, out = Path(args.assets_dir), Path(args.raw_dir), Path(args.out)
    if not (assets_dir / "index.json").is_file():
        print(f"Error: {assets_dir / 'index.json'} not found; run tools/organize_assets.py first.", file=sys.stderr)
        return 1

    curated = build_curated(assets_dir)
    data = {
        "sections": SECTIONS,
        "styleOrder": STYLE_ORDER,
        "styleLabels": STYLE_LABELS,
        "controlOrder": CONTROL_ORDER,
        "curated": sorted(curated, key=lambda a: (a["category"], theme_sort_key(a.get("theme") or a.get("group") or ""), a["key"])),
        "raw": build_raw(raw_dir),
    }
    payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(PAGE.replace("__DATA__", payload), encoding="utf-8")
    print(f"Asset library generated: {out.resolve()} ({len(curated)} curated, {len(data['raw'])} raw)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
