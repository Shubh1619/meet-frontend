import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { DarkModeProvider } from "./context/DarkModeContext";
import { ToastProvider } from "./components/ToastProvider";
import App from "./App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <DarkModeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </DarkModeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
