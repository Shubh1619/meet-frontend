import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);
const DEFAULT_DURATION = 3500;
const FADE_MS = 300;

const TYPE_THEME = {
  primary: "#3b82f6",
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
  default: "#1f2937",
};

const TYPE_ICON = {
  primary: "\u2139",
  success: "\u2713",
  error: "!",
  warning: "\u26a0",
  default: "\u2022",
};

function normalizeType(type) {
  if (type === "danger") return "error";
  if (type === "info") return "primary";
  if (type === "primary" || type === "success" || type === "error" || type === "warning") return type;
  return "default";
}

const ToastItem = memo(function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef(null);
  const removeTimerRef = useRef(null);
  const closingRef = useRef(false);
  const type = normalizeType(toast.type);

  const startClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setVisible(false);
    removeTimerRef.current = setTimeout(() => onRemove(toast.id), FADE_MS);
  }, [onRemove, toast.id]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    closeTimerRef.current = setTimeout(startClose, toast.duration ?? DEFAULT_DURATION);

    return () => {
      cancelAnimationFrame(raf);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    };
  }, [startClose, toast.duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        borderRadius: "10px",
        padding: "12px 16px",
        color: "#ffffff",
        background: TYPE_THEME[type],
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 300ms ease, transform 300ms ease",
      }}
    >
      <span aria-hidden="true" style={{ flexShrink: 0, fontSize: "14px", fontWeight: 700 }}>
        {TYPE_ICON[type]}
      </span>
      <p style={{ margin: 0, minWidth: 0, flex: 1, fontSize: "14px", lineHeight: 1.35 }}>{toast.message}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {toast.onAction ? (
          <button
            type="button"
            onClick={toast.onAction}
            style={{
              border: "1px solid rgba(255,255,255,0.45)",
              borderRadius: "6px",
              padding: "2px 8px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#fff",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {toast.actionLabel || "Action"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={startClose}
          aria-label="Close notification"
          style={{
            border: "none",
            background: "transparent",
            color: "#fff",
            fontSize: "18px",
            lineHeight: 1,
            cursor: "pointer",
            padding: 0,
          }}
        >
          {"\u00d7"}
        </button>
      </div>
    </div>
  );
});

export const ToastContainer = memo(function ToastContainer({ toasts, onRemove }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: 9999,
        width: "min(420px, 92vw)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
});

function normalizePushArgs(message, titleOrOptions, durationArg) {
  let duration = DEFAULT_DURATION;
  let actionLabel = "Action";
  let onAction;
  let resolvedMessage = message;

  if (typeof titleOrOptions === "number") {
    duration = titleOrOptions;
  } else if (typeof titleOrOptions === "string" && titleOrOptions.trim()) {
    resolvedMessage = `${titleOrOptions.trim()}: ${message}`;
  } else if (titleOrOptions && typeof titleOrOptions === "object") {
    if (typeof titleOrOptions.duration === "number") duration = titleOrOptions.duration;
    if (typeof titleOrOptions.title === "string" && titleOrOptions.title.trim()) {
      resolvedMessage = `${titleOrOptions.title.trim()}: ${message}`;
    }
    if (typeof titleOrOptions.actionLabel === "string" && titleOrOptions.actionLabel.trim()) {
      actionLabel = titleOrOptions.actionLabel.trim();
    }
    if (typeof titleOrOptions.onAction === "function") {
      onAction = titleOrOptions.onAction;
    }
  }

  if (typeof durationArg === "number") {
    duration = durationArg;
  }

  return { duration, actionLabel, onAction, message: resolvedMessage };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const push = useCallback((type, message, titleOrOptions, durationArg) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const normalized = normalizePushArgs(message, titleOrOptions, durationArg);
    const toast = {
      id,
      type: normalizeType(type),
      message: normalized.message,
      duration: normalized.duration,
      actionLabel: normalized.actionLabel,
      onAction: normalized.onAction,
    };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const api = useMemo(
    () => ({
      push,
      dismiss,
      clear,
      primary: (message, titleOrOptions, duration) => push("primary", message, titleOrOptions, duration),
      success: (message, titleOrOptions, duration) => push("success", message, titleOrOptions, duration),
      error: (message, titleOrOptions, duration) => push("error", message, titleOrOptions, duration),
      warning: (message, titleOrOptions, duration) => push("warning", message, titleOrOptions, duration),
      default: (message, titleOrOptions, duration) => push("default", message, titleOrOptions, duration),
      info: (message, titleOrOptions, duration) => push("primary", message, titleOrOptions, duration),
      danger: (message, titleOrOptions, duration) => push("error", message, titleOrOptions, duration),
    }),
    [dismiss, push, clear]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onRemove={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
