import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import PasswordInput from "../components/PasswordInput";
import { useDarkMode } from "../context/DarkModeContext";
import { API_BASE, getApiErrorMessage } from "../api";
import { useToast } from "../components/ToastProvider";
import { focusFirstInvalidField } from "../utils/formUtils";

function validatePassword(value) {
  if (!value || value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(value)) return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Password must include at least one lowercase letter.";
  if (!/\d/.test(value)) return "Password must include at least one number.";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return "Password must include at least one special character.";
  return "";
}

export default function ResetPassword() {
  const { darkMode } = useDarkMode();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = (searchParams.get("token") || "").trim();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const toast = useToast();

  const cardBg = darkMode ? "#16213e" : "#fff";
  const bgColor = darkMode ? "#1a1a2e" : "#F8F9FF";
  const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";
  const mutedColor = darkMode ? "#888" : "#606074";

  const passwordValidation = useMemo(() => validatePassword(newPassword), [newPassword]);

  const strength = useMemo(() => {
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[a-z]/.test(newPassword)) score += 1;
    if (/\d/.test(newPassword)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) score += 1;
    return score;
  }, [newPassword]);

  const strengthLabel = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Excellent"][strength];
  const strengthColor = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#16a34a"][strength];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});

    if (!tokenFromUrl) {
      setError("Reset link is missing or invalid. Please request a new link.");
      toast.error("Reset link is missing or invalid.");
      return;
    }

    if (passwordValidation) {
      setError(passwordValidation);
      setFieldErrors({ newPassword: passwordValidation });
      focusFirstInvalidField(e.currentTarget);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      focusFirstInvalidField(e.currentTarget);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromUrl, new_password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(data, "Password reset failed."));

      setSuccess(data.message || "Password reset successful. Please login.");
      toast.success("Password reset successful.");
      setTimeout(() => nav("/login"), 1200);
    } catch (err) {
      const msg = err.message || "Something went wrong.";
      if (msg.toLowerCase().includes("expired")) {
        setError("This reset link has expired. Please request a new password reset link.");
      } else if (msg.toLowerCase().includes("already been used")) {
        setError("This reset link has already been used. Please request a new password reset link.");
      } else if (msg.toLowerCase().includes("invalid")) {
        setError("This reset link is invalid. Please request a new password reset link.");
      } else {
        setError(msg);
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const showResendOption =
    !tokenFromUrl ||
    error.toLowerCase().includes("expired") ||
    error.toLowerCase().includes("already been used") ||
    error.toLowerCase().includes("invalid");

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
          maxWidth: 480,
          width: "100%",
          background: cardBg,
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginBottom: "0.4rem", color: textColor }}>Reset Password</h2>
        <p style={{ marginTop: 0, marginBottom: "1rem", color: mutedColor }}>
          Set your new password securely.
        </p>

        {!tokenFromUrl && (
          <div
            style={{
              background: "#fff5e6",
              color: "#9a6700",
              padding: "0.8rem",
              borderRadius: 10,
              marginBottom: "1rem",
            }}
          >
            No reset token found in URL.
          </div>
        )}

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

        <form onSubmit={handleSubmit}>
          <label className="small-muted mt-1 required-label" style={{ color: mutedColor }}>
            New Password
          </label>
          <PasswordInput
            className="input mt-1"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            data-invalid={fieldErrors.newPassword ? "true" : "false"}
            aria-invalid={fieldErrors.newPassword ? "true" : "false"}
            style={{
              background: darkMode ? "#0f0f23" : "#fff",
              color: textColor,
              borderColor: fieldErrors.newPassword ? "#dc2626" : (darkMode ? "#333" : "#ddd"),
            }}
            iconClassName={darkMode ? "text-slate-300" : "text-slate-500"}
          />
          {fieldErrors.newPassword && <div className="field-error">{fieldErrors.newPassword}</div>}

          <div style={{ marginTop: "0.5rem" }}>
            <div
              style={{
                width: "100%",
                height: 6,
                borderRadius: 999,
                background: darkMode ? "#1f2937" : "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(strength / 5) * 100}%`,
                  height: "100%",
                  background: strengthColor,
                  transition: "width 0.2s ease",
                }}
              />
            </div>
            <p style={{ margin: "0.35rem 0 0", color: mutedColor, fontSize: "0.85rem" }}>
              Strength: <span style={{ color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
            </p>
          </div>

          <label className="small-muted mt-1 required-label" style={{ color: mutedColor }}>
            Confirm New Password
          </label>
          <PasswordInput
            className="input mt-1"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            data-invalid={fieldErrors.confirmPassword ? "true" : "false"}
            aria-invalid={fieldErrors.confirmPassword ? "true" : "false"}
            style={{
              background: darkMode ? "#0f0f23" : "#fff",
              color: textColor,
              borderColor: fieldErrors.confirmPassword ? "#dc2626" : (darkMode ? "#333" : "#ddd"),
            }}
            iconClassName={darkMode ? "text-slate-300" : "text-slate-500"}
          />
          {fieldErrors.confirmPassword && <div className="field-error">{fieldErrors.confirmPassword}</div>}

          <div style={{ marginTop: "1.2rem" }}>
            <ActionButton type="submit" style={{ width: "100%" }} disabled={loading || !tokenFromUrl}>
              {loading ? "Resetting..." : "Reset Password"}
            </ActionButton>
          </div>
        </form>

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          {showResendOption && (
            <button
              onClick={() => nav("/forgot-password")}
              style={{
                border: "none",
                background: "transparent",
                color: "#6759FF",
                fontWeight: 600,
                cursor: "pointer",
                marginRight: "0.75rem",
              }}
            >
              Request New Reset Link
            </button>
          )}
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
