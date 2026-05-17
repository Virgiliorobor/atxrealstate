import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ProductionApp from "./production/ProductionApp";
import "./index.css";

// Path-based routing — single SPA, two roots.
// /app and /app/* → production version (Option C, with auth + persistence)
// /              → demo (preserved as-is)
const isProduction = window.location.pathname.startsWith("/app");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{isProduction ? <ProductionApp /> : <App />}</React.StrictMode>
);
