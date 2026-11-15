/**
 * PRISMA STREAM — Application Entry Point
 * Mounts the PrismaStream React application onto the DOM.
 */

import { PrismaStreamApp } from "./components/App.js";

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("root");
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(PrismaStreamApp));
  }
});
