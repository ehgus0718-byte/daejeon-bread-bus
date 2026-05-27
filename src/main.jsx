import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./customerHero.css";
import App from "./AppSafe.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

if (typeof window !== "undefined") {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  document.body.dataset.adminPage = pathname === "/admin" ? "true" : "false";
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary fallbackTitle="대전빵셔틀 화면을 불러오지 못했습니다.">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
