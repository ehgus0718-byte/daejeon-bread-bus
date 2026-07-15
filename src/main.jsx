import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./customerHero.css";
import App from "./AppSafe.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import CustomerPopup from "./components/CustomerPopup.jsx";

let isCustomerPage = true;
if (typeof window !== "undefined") {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  document.body.dataset.adminPage = pathname === "/admin" ? "true" : "false";
  isCustomerPage = pathname !== "/admin" && !pathname.startsWith("/payment-result");
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary fallbackTitle="대전빵셔틀 화면을 불러오지 못했습니다.">
      <App />
      {isCustomerPage ? <CustomerPopup /> : null}
    </ErrorBoundary>
  </React.StrictMode>
);
