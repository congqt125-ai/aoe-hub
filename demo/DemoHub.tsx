import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  DIALOG_THEMES, SCREEN_THEMES, Toggle, useTheme, cx,
  type DialogTheme, type FrameStyle, type ScreenTheme,
} from "../components";
import { players } from "./shared/mock";
import { AtomStories } from "./gallery/AtomStories";
import { CivRollerDemo } from "./gallery/CivRollerDemo";
import { MoleculeStories } from "./gallery/MoleculeStories";
import { OrganismStories } from "./gallery/OrganismStories";
import type { Backdrop } from "./gallery/Story";

/**
 * Single demo page (user, 13/11): every demo in one place, picked from the side menu.
 * - Components: the React stories, rendered here under the shared ThemeProvider.
 * - Theme: tokens / textures / asset library are generated or standalone HTML pages → embedded as-is.
 * - Layout: the prototype app (fixed 1600x900 stage) scaled down to fit.
 */
type Section =
  | { id: string; label: string; group: string; note: string; kind: "stories"; render: (b: Backdrop) => ReactNode }
  | { id: string; label: string; group: string; note: string; kind: "page"; src: string }
  | { id: string; label: string; group: string; note: string; kind: "app"; src: string; signedIn: boolean };

const SECTIONS: Section[] = [
  { id: "atoms", label: "Nguyên tử", group: "Component", kind: "stories", note: "Atoms — 22 thành phần cơ bản", render: (b) => <AtomStories backdrop={b} /> },
  { id: "molecules", label: "Phân tử", group: "Component", kind: "stories", note: "Molecules — ghép từ nguyên tử", render: (b) => <MoleculeStories backdrop={b} /> },
  { id: "organisms", label: "Thành phần", group: "Component", kind: "stories", note: "Organisms — khối giao diện hoàn chỉnh", render: (b) => <OrganismStories backdrop={b} /> },
  { id: "civ-roller", label: "Quay quân", group: "Công cụ", kind: "stories", note: "Quay quân ngẫu nhiên 1vs1, 1vs2, 3vs3, 4vs4 kèm bảng điểm & lợi thế", render: (b) => <CivRollerDemo backdrop={b} /> },
  { id: "tokens", label: "Theme & tokens", group: "Theme", kind: "page", src: "tokens/index.html", note: "Bảng màu, bevel, font, tương phản của từng theme — sinh bởi tools/build_tokens.py" },
  { id: "textures", label: "Texture hộp thoại", group: "Theme", kind: "page", src: "textures/index.html", note: "Thử texture hộp thoại trên nền theo theme" },
  { id: "assets", label: "Thư viện asset", group: "Theme", kind: "page", src: "asset-browser/index.html", note: "Asset trong assets/ui/ — sinh bởi tools/build_asset_browser.py" },
  { id: "login", label: "Đăng nhập", group: "Bố cục", kind: "app", src: "app/#/login", signedIn: false, note: "T1 — sân khấu 1600×900 + thanh công cụ duyệt ở rìa phải, thu nhỏ cho vừa khung" },
  { id: "lobby", label: "Sảnh & phòng chơi", group: "Bố cục", kind: "app", src: "app/#/lobby", signedIn: true, note: "T3 / T4 — Tạo phòng, Vào, Vào xem để sang Phòng chơi" },
  { id: "login-html", label: "Đăng nhập (bản HTML cũ)", group: "Bố cục", kind: "page", src: "screens/login.html", note: "Bản mẫu HTML trước khi chuyển sang React ở T1" },
];
const GROUPS = [...new Set(SECTIONS.map((s) => s.group))];
const FRAMES: { id: FrameStyle; label: string }[] = [
  { id: "game", label: "Game" },
  { id: "lit", label: "A′" },
  { id: "modern", label: "B" },
];

// Same key as demo/app/App.tsx: the embedded app reads its fake session from here (iframes share the tab's sessionStorage).
const SESSION_KEY = "aoe-hub-session";

function parse(hash: string): Section {
  const id = hash.replace(/^#\/?/, "");
  return SECTIONS.find((s) => s.id === id) ?? SECTIONS[0];
}

// The prototype app keeps a fixed 1600x900 stage + the 40px review rail at its right edge (demo/app/index.html).
const APP_W = 1640;
const APP_H = 900;

/** Scale the whole app page (stage + rail) down to the space available. */
function AppStage({ src }: { src: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => setScale(Math.min(el.clientWidth / APP_W, el.clientHeight / APP_H, 1)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="flex h-full w-full items-center justify-center overflow-hidden p-4">
      <div className="shrink-0 bevel-sunken" style={{ width: APP_W * scale, height: APP_H * scale }}>
        <iframe
          title="Ứng dụng mẫu"
          src={src}
          className="block border-0 bg-black"
          style={{ width: APP_W, height: APP_H, transform: `scale(${scale})`, transformOrigin: "0 0" }}
        />
      </div>
    </div>
  );
}

function ThemeControls({ backdrop, setBackdrop }: { backdrop: Backdrop; setBackdrop: (b: Backdrop) => void }) {
  const theme = useTheme();
  const pill = (on: boolean) => cx("px-2 py-0.5", on ? "bg-white/25" : "bg-white/10 hover:bg-white/15");
  return (
    <>
      <label className="flex items-center gap-1.5">
        Màn hình
        <select className="bg-black text-white" value={theme.screen} onChange={(e) => theme.setScreen(e.target.value as ScreenTheme)}>
          {SCREEN_THEMES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-1.5">
        Hộp thoại
        <select className="bg-black text-white" value={theme.dialog} onChange={(e) => theme.setDialog(e.target.value as DialogTheme)}>
          {DIALOG_THEMES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <span className="flex items-center gap-1">
        Viền:
        {FRAMES.map((f) => (
          <button key={f.id} type="button" aria-pressed={theme.frame === f.id} onClick={() => theme.setFrame(f.id)} className={pill(theme.frame === f.id)}>
            {f.label}
          </button>
        ))}
      </span>
      <span className="flex items-center gap-1">
        Nền mẫu:
        {(["dialog", "screen"] as const).map((b) => (
          <button key={b} type="button" aria-pressed={backdrop === b} onClick={() => setBackdrop(b)} className={pill(backdrop === b)}>
            {b === "dialog" ? "Hộp thoại" : "Màn hình"}
          </button>
        ))}
      </span>
      <Toggle checked={theme.gameCursor} onChange={theme.setGameCursor} label={<span className="text-white">Con trỏ game</span>} />
    </>
  );
}

export function DemoHub() {
  const [section, setSection] = useState(() => parse(location.hash));
  const [backdrop, setBackdrop] = useState<Backdrop>("dialog");
  useEffect(() => {
    const onHash = () => setSection(parse(location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Embedded app: signed in for the hub screens, signed out for the login screen. Runs before the iframe mounts.
  const appKey = section.kind === "app" ? section.id : null;
  if (section.kind === "app") {
    try {
      if (section.signedIn) sessionStorage.setItem(SESSION_KEY, JSON.stringify(players.me));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* private mode: the app falls back to its login screen */
    }
  }

  // The shell's tuner (Alt+T) only tunes the component sections; embedded pages bring their own.
  useEffect(() => {
    const tuner = document.querySelector<HTMLElement>(".aoe-tuner");
    if (tuner) tuner.style.display = section.kind === "stories" ? "" : "none";
  }, [section.kind]);

  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo(0, 0);
  }, [section.id]);

  return (
    <div className="flex h-screen font-body text-sm text-white">
      <aside className="flex w-56 shrink-0 flex-col gap-5 overflow-y-auto bg-black/85 px-3 py-4">
        <strong className="px-2 font-heading text-xl leading-tight">AoE Hub<br /><span className="text-sm font-normal text-white/60">trang demo</span></strong>
        {GROUPS.map((g) => (
          <nav key={g} aria-label={g} className="flex flex-col gap-0.5">
            <span className="px-2 pb-1 font-heading text-xs uppercase tracking-wider text-screen-state">{g}</span>
            {SECTIONS.filter((s) => s.group === g).map((s) => (
              <a
                key={s.id}
                href={`#/${s.id}`}
                aria-current={s.id === section.id ? "page" : undefined}
                className={cx(
                  "px-2 py-1 text-white no-underline",
                  s.id === section.id ? "bg-white/20 text-screen-focus" : "hover:bg-white/10",
                )}
              >
                {s.label}
              </a>
            ))}
          </nav>
        ))}
        <a href="app/" target="_blank" rel="noreferrer" className="mt-auto px-2 text-xs text-white/60 hover:text-white">Mở ứng dụng mẫu ↗</a>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-sticky flex flex-wrap items-center gap-x-5 gap-y-2 bg-black/80 px-4 py-2">
          <h1 className="m-0 font-heading text-lg font-semibold">{section.label}</h1>
          <span className="text-xs text-white/60">{section.note}</span>
          <span className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
            {section.kind === "stories" ? (
              <ThemeControls backdrop={backdrop} setBackdrop={setBackdrop} />
            ) : (
              <a href={section.src} target="_blank" rel="noreferrer" className="text-white/80 hover:text-white">Mở riêng ↗</a>
            )}
          </span>
        </header>

        {section.kind === "stories" ? (
          <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
            <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">{section.render(backdrop)}</main>
          </div>
        ) : section.kind === "page" ? (
          <iframe key={section.id} title={section.label} src={section.src} className="min-h-0 w-full flex-1 border-0 bg-black" />
        ) : (
          <div className="min-h-0 flex-1 bg-black/60">
            <AppStage key={appKey} src={section.src} />
          </div>
        )}
      </div>
    </div>
  );
}
