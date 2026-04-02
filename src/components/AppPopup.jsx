import React from "react";

export default function AppPopup({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmVariant = "danger",
  children,
}) {
  if (!open) return null;

  return (
    <div className="app-popup-overlay" role="presentation" onClick={onCancel}>
      <div
        className="app-popup-card"
        role="dialog"
        aria-modal="true"
        aria-label={title || "Popup"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-popup-glow" />
        {title ? <h3 className="app-popup-title">{title}</h3> : null}
        {message ? <p className="app-popup-message">{message}</p> : null}
        {children ? <div className="app-popup-body">{children}</div> : null}
        <div className="app-popup-actions">
          <button type="button" className="app-popup-btn app-popup-btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`app-popup-btn ${confirmVariant === "primary" ? "app-popup-btn-primary" : "app-popup-btn-danger"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

