import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

const ICONS = {
  success: "\u2705",
  error: "\u274c",
  warning: "\u26a0\ufe0f",
  info: "\u2139\ufe0f",
};

function ToastItem({ toast, onClose }) {
  const [remaining, setRemaining] = useState(toast.duration ?? 3500);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [timerId, setTimerId] = useState(() => setTimeout(() => onClose(toast.id), remaining));
  const progress = Math.max(6, Math.min(100, Math.round((remaining / (toast.duration ?? 3500)) * 100)));

  const clearTimer = useCallback(() => {
    if (timerId) {
      clearTimeout(timerId);
      setTimerId(null);
    }
  }, [timerId]);

  const pause = useCallback(() => {
    clearTimer();
    const elapsed = Date.now() - startedAt;
    setRemaining((prev) => Math.max(0, prev - elapsed));
  }, [clearTimer, startedAt]);

  const resume = useCallback(() => {
    if (remaining <= 0) {
      onClose(toast.id);
      return;
    }
    setStartedAt(Date.now());
    setTimerId(setTimeout(() => onClose(toast.id), remaining));
  }, [onClose, remaining, toast.id]);

  return (
    <div
      className={`app-toast app-toast--${toast.type}`}
      role="status"
      aria-live="polite"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <div className="app-toast-icon-wrap">
        <div className="app-toast-icon" aria-hidden="true">{ICONS[toast.type] || ICONS.info}</div>
      </div>
      <div className="app-toast-content">
        {toast.title ? <div className="app-toast-title">{toast.title}</div> : null}
        <div className="app-toast-message">{toast.message}</div>
        <div className="app-toast-progress-track">
          <div className="app-toast-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <button className="app-toast-close" onClick={() => onClose(toast.id)} aria-label="Close notification">
        {"\u00d7"}
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, title = "", duration = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, message, title, duration }]);
    return id;
  }, []);

  const api = useMemo(
    () => ({
      success: (message, title = "Success", duration) => push("success", message, title, duration),
      error: (message, title = "Error", duration) => push("error", message, title, duration),
      warning: (message, title = "Warning", duration) => push("warning", message, title, duration),
      info: (message, title = "Info", duration) => push("info", message, title, duration),
      push,
      dismiss: removeToast,
    }),
    [push, removeToast]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="app-toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
