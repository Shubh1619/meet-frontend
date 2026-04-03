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
  primary: "bg-blue-500",
  success: "bg-green-500",
  error: "bg-red-500",
  warning: "bg-yellow-500",
  default: "bg-gray-800",
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
      className={[
        "pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 text-white",
        "transition-opacity duration-300 transform",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        TYPE_THEME[type],
      ].join(" ")}
    >
      <span className="shrink-0 text-sm font-semibold" aria-hidden="true">
        {TYPE_ICON[type]}
      </span>
      <p className="min-w-0 flex-1 truncate text-sm">{toast.message}</p>
      <div className="flex shrink-0 items-center gap-2">
        {toast.onAction ? (
          <button
            type="button"
            onClick={toast.onAction}
            className="rounded px-2 py-1 text-xs font-medium text-white/95 hover:text-white focus:outline-none focus:ring-1 focus:ring-white/70"
          >
            {toast.actionLabel || "Action"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={startClose}
          className="rounded px-1 text-base leading-none text-white/90 hover:text-white focus:outline-none focus:ring-1 focus:ring-white/70"
          aria-label="Close notification"
        >
          {"\u00d7"}
        </button>
      </div>
    </div>
  );
});

export const ToastContainer = memo(function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex w-[min(92vw,420px)] flex-col space-y-2 pointer-events-none">
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
