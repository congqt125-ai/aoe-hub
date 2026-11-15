import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../components/styles.css";
import { ThemeProvider } from "../../components";
import { App } from "./App";
// Review-only sliders for background / dialog treatment (Alt+T).
import "../shared/tuner.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider screen="hub-temple" dialog="dlg6_3">
      <App />
    </ThemeProvider>
  </StrictMode>,
);
