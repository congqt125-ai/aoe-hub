import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaults, factions, themes } from "../../tokens/design-tokens.json";

export type ScreenTheme = keyof typeof themes.screens;
export type DialogTheme = keyof typeof themes.dialogs;
export type Faction = keyof typeof factions;

export const SCREEN_THEMES = Object.keys(themes.screens) as ScreenTheme[];
export const DIALOG_THEMES = Object.keys(themes.dialogs) as DialogTheme[];
export const FACTIONS = Object.keys(factions) as Faction[];
export const DEFAULT_SCREEN_THEME = defaults.screen as ScreenTheme;
export const DEFAULT_DIALOG_THEME = defaults.dialog as DialogTheme;

/** Frame (border) style, set as data-frame on <html>: game bevel, "lit" (kiểu A′), "modern" (kiểu B). */
export type FrameStyle = "game" | "lit" | "modern";

export const FACTION_LABELS: Record<Faction, string> = {
  egyptian: "Ai Cập",
  greek: "Hy Lạp",
  babylonian: "Babylon",
  asian: "Á Đông",
  roman: "La Mã",
};

/** Dialog texture by material; used by Surface and as a short name for dialog themes. */
export const TEXTURES = {
  sandstone: "dlg6_0",
  marble: "dlg6_1",
  brick: "dlg6_2",
  wood: "dlg6_3",
  darkstone: "dlg6_4",
  sand: "dlg3",
} as const satisfies Record<string, DialogTheme>;
export type Texture = keyof typeof TEXTURES;

interface ThemeState {
  screen: ScreenTheme;
  dialog: DialogTheme;
  /** false = system cursors (Settings: "Dùng con trỏ của game"). */
  gameCursor: boolean;
  frame: FrameStyle;
  setScreen: (t: ScreenTheme) => void;
  setDialog: (t: DialogTheme) => void;
  setGameCursor: (on: boolean) => void;
  setFrame: (f: FrameStyle) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

interface ThemeProviderProps {
  screen?: ScreenTheme;
  dialog?: DialogTheme;
  gameCursor?: boolean;
  frame?: FrameStyle;
  children: ReactNode;
}

/**
 * Applies the theme on <html> (data-theme, data-dialog-theme, data-cursor, data-frame); every component follows
 * through CSS variables, so switching never re-renders the tree.
 */
export function ThemeProvider({ screen: s0 = DEFAULT_SCREEN_THEME, dialog: d0 = DEFAULT_DIALOG_THEME, gameCursor: c0 = true, frame: f0 = "game", children }: ThemeProviderProps) {
  const [screen, setScreen] = useState<ScreenTheme>(s0);
  const [dialog, setDialog] = useState<DialogTheme>(d0);
  const [gameCursor, setGameCursor] = useState(c0);
  const [frame, setFrame] = useState<FrameStyle>(f0);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.theme = screen;
    html.dataset.dialogTheme = dialog;
    if (gameCursor) delete html.dataset.cursor;
    else html.dataset.cursor = "system";
    if (frame === "game") delete html.dataset.frame;
    else html.dataset.frame = frame;
  }, [screen, dialog, gameCursor, frame]);

  // See tokens (cursor rules): re-show the game cursor after typing (Windows "hide pointer while typing").
  useEffect(() => {
    if (!gameCursor) return;
    const html = document.documentElement;
    let typed = false;
    const onKey = () => {
      typed = true;
    };
    const onMove = () => {
      if (!typed) return;
      typed = false;
      html.dataset.cursorNudge = html.dataset.cursorNudge === "1" ? "0" : "1";
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("mousemove", onMove, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("mousemove", onMove, true);
      delete html.dataset.cursorNudge;
    };
  }, [gameCursor]);

  const value = useMemo(
    () => ({ screen, dialog, gameCursor, frame, setScreen, setDialog, setGameCursor, setFrame }),
    [screen, dialog, gameCursor, frame],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme() must be used inside <ThemeProvider>");
  return ctx;
}
