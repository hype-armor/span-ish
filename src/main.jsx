import React, { createRoot } from "./react.js";
import { installStorage } from "./lib/storage.js";
import { App } from "./App.jsx";

installStorage();

createRoot(document.getElementById("root")).render(<App />);

/* Keep the browser chrome in step with the in-app theme toggle. */
function syncThemeColour() {
  const app = document.querySelector(".app");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!app || !meta) return;
  meta.setAttribute("content", app.dataset.theme === "dark" ? "#0E1420" : "#F7F5F1");
}
new MutationObserver(syncThemeColour).observe(document.getElementById("root"), {
  subtree: true,
  attributes: true,
  attributeFilter: ["data-theme"],
});
setTimeout(syncThemeColour, 0);

/* A service worker needs http(s); opening the file off disk is fine without it. */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
