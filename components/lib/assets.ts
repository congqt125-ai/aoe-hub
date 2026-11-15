// Game assets resolved through Vite so they are hashed and bundled (dev server, build, Electron).
// Control sprites (checkbox, close, arrows) are not here: they come from CSS variables --t-ctl-* per theme.
// Small-control sprite sets (user 12/11): the dropdown button and the "drawn" checkbox use one of these,
// whatever the theme — scr3 (light sand, default) or scr2 (orange, in the room). The marks are tiny (check
// ≈ 23px in 86, arrow ≈ 15px in 72), so the controls zoom the sprite around its center by `zoom`.
const sprites = import.meta.glob<string>("../../assets/ui/button/{scr2,scr3}-{checkbox-off-normal,checkbox-on-normal,checkbox-on-pressed,arrow-down-normal,arrow-down-pressed}.png", {
  eager: true,
  query: "?url",
  import: "default",
});
const sprite = (set: string, name: string) => sprites[`../../assets/ui/button/${set}-${name}.png`];

export type ControlSet = "scr3" | "scr2";

export interface ControlSprites {
  checkboxOff: string;
  checkboxOn: string;
  checkboxOnPressed: string;
  arrowDown: string;
  arrowDownPressed: string;
  /** background-size relative to the box. */
  zoom: { checkbox: string; arrow: string };
}

const makeSet = (set: ControlSet, zoom: ControlSprites["zoom"]): ControlSprites => ({
  checkboxOff: sprite(set, "checkbox-off-normal"),
  checkboxOn: sprite(set, "checkbox-on-normal"),
  checkboxOnPressed: sprite(set, "checkbox-on-pressed"),
  arrowDown: sprite(set, "arrow-down-normal"),
  arrowDownPressed: sprite(set, "arrow-down-pressed"),
  zoom,
});

export const CONTROL_SETS: Record<ControlSet, ControlSprites> = {
  // Check ≈ 85% of a 22px box, arrow ≈ 40% of the 26px button.
  scr3: makeSet("scr3", { checkbox: "320%", arrow: "350%" }),
  // Moderate zoom (user 12/11): check ≈ 65% of a 26px box, arrow ≈ 50% of the button.
  scr2: makeSet("scr2", { checkbox: "260%", arrow: "240%" }),
};

const urls = import.meta.glob<string>("../../assets/ui/{icon,hud,minimap,cursor,dialog}/*.{png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

export interface SheetFrame {
  frame: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Sheet {
  sheet_width: number;
  sheet_height: number;
  frames: SheetFrame[];
}

const sheets = import.meta.glob<Sheet>("../../assets/ui/{icon,hud,fx}/*-sheet.json", { eager: true, import: "default" });

/** URL of an asset by its path under assets/ui/, e.g. "icon/res-wood.png". */
export function assetUrl(path: string): string {
  const url = urls[`../../assets/ui/${path}`];
  if (!url) throw new Error(`Unknown asset: assets/ui/${path}`);
  return url;
}

/** Sprite sheet image + frame table, e.g. sheet("icon/units") -> icon/units-sheet.{png,json}. */
export function sheet(name: string): { url: string; data: Sheet } {
  const data = sheets[`../../assets/ui/${name}-sheet.json`];
  if (!data) throw new Error(`Unknown sprite sheet: assets/ui/${name}-sheet.json`);
  return { url: assetUrl(`${name}-sheet.png`), data };
}
