import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../components/styles.css";
import { DIALOG_THEMES, SCREEN_THEMES, ThemeProvider, type DialogTheme, type ScreenTheme } from "../components";
import { DemoHub } from "./DemoHub";
// Review-only sliders for background / dialog treatment (Alt+T).
import "./shared/tuner.js";

// ?screen=scr5&dialog=dlg6_3 opens the component sections on another theme (screenshots, review).
const params = new URLSearchParams(location.search);
// Demo opens on the village picture + wood dialog (user's pick after demo/textures);
// the project default stays tokens `defaults.screen` / `defaults.dialog`.
const DEMO_SCREEN: ScreenTheme = "hub-village";
const DEMO_DIALOG: DialogTheme = "dlg6_3";
const screen = (SCREEN_THEMES.find((t) => t === params.get("screen")) as ScreenTheme | undefined) ?? DEMO_SCREEN;
const dialog = (DIALOG_THEMES.find((t) => t === params.get("dialog")) as DialogTheme | undefined) ?? DEMO_DIALOG;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider screen={screen} dialog={dialog}>
      <DemoHub />
    </ThemeProvider>
  </StrictMode>,
);
