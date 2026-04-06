import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import { useDarkMode } from "../context/DarkModeContext";
import { API_BASE, getApiErrorMessage } from "../api";
import { useToast } from "../components/ToastProvider";
import { focusFirstInvalidField, isValidEmail } from "../utils/formUtils";

export default function ForgotPassword() {
  const { darkMode } = useDarkMode();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldError, setFieldError] = useState("");
  const toast = useToast();

  const cardBg = darkMode ? "#16213e" : "#fff";
  const bgColor = darkMode ? "#1a1a2e" : "#F8F9FF";
  const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";
  const mutedColor = darkMode ? "#888" : "#606074";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldError("");

    const cleaned = email.trim().toLowerCase();
    if (!cleaned) {
      setFieldError("Email is required.");
      focusFirstInvalidField(e.currentTarget);
      return;
    }

    if (!isValidEmail(cleaned)) {
      const message = "Invalid email. Please include '@' (example: name@example.com).";
      setError(message);
      setFieldError(message);
      focusFirstInvalidField(e.currentTarget);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleaned }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(data, "Failed to request password reset."));

      setSuccess(
        data.message
      );
      toast.success("Reset link request submitted.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
      toast.error(err.message || "Failed to request reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        background: bgColor,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: "5rem",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: "100%",
          background: cardBg,
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginBottom: "0.4rem", color: textColor }}>Forgot Password</h2>
        <p style={{ marginTop: 0, marginBottom: "1rem", color: mutedColor }}>
          Enter your email to receive a secure password reset link.
        </p>

        {error && (
          <div
            style={{
              background: "#ffe5e5",
              color: "#ff3b3b",
              padding: "0.8rem",
              borderRadius: 10,
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#e9fbe9",
              color: "#1d7c35",
              padding: "0.8rem",
              borderRadius: 10,
              marginBottom: "1rem",
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label className="small-muted required-label" style={{ color: mutedColor }}>
            Email
          </label>
          <input
            className={`input mt-1 ${fieldError ? "border-red-500" : ""}`}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldError) setFieldError("");
            }}
            placeholder="you@example.com"
            data-invalid={fieldError ? "true" : "false"}
            aria-invalid={fieldError ? "true" : "false"}
            style={{
              background: darkMode ? "#0f0f23" : "#fff",
              color: textColor,
              borderColor: fieldError ? "#ef4444" : (darkMode ? "#333" : "#ddd"),
            }}
          />
          {fieldError && <div className="text-red-500 text-sm mt-1" style={{ color: "#ef4444" }}>{fieldError}</div>}

          <div style={{ marginTop: "1.2rem" }}>
            <ActionButton type="submit" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </ActionButton>
          </div>
        </form>

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <button
            onClick={() => nav("/login")}
            style={{
              border: "none",
              background: "transparent",
              color: "#6759FF",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
