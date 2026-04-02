import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import { useDarkMode } from "../context/DarkModeContext";
import { API_BASE } from "../api";

export default function VerifyEmail() {
  const { darkMode } = useDarkMode();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [info, setInfo] = useState(location.state?.message || "");
  const [resendLoading, setResendLoading] = useState(false);

  const cardBg = darkMode ? "#16213e" : "#fff";
  const bgColor = darkMode ? "#1a1a2e" : "#F8F9FF";
  const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";
  const mutedColor = darkMode ? "#888" : "#606074";

  useEffect(() => {
    if (location.state?.message) {
      setInfo(location.state.message);
    }
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setInfo("");

    const cleanedEmail = email.trim().toLowerCase();
    const cleanedOtp = otp.trim();
    if (!cleanedEmail) {
      setError("Email is required.");
      return;
    }
    if (!cleanedOtp) {
      setError("OTP is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanedEmail, otp: cleanedOtp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to verify email.");
      setSuccess(data.message || "Email verified successfully.");
      setTimeout(() => nav("/login"), 1200);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setSuccess("");
    setInfo("");
    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail) {
      setError("Enter your email to resend OTP.");
      return;
    }

    setResendLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanedEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to resend OTP.");
      setInfo(data.message || "Verification OTP sent.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setResendLoading(false);
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
        <h2 style={{ marginBottom: "0.4rem", color: textColor }}>Verify Email</h2>
        <p style={{ marginTop: 0, marginBottom: "1rem", color: mutedColor }}>
          Enter the OTP sent to your email address.
        </p>

        {info && (
          <div style={{ background: "#e8f0ff", color: "#1a4fd6", padding: "0.8rem", borderRadius: 10, marginBottom: "1rem" }}>
            {info}
          </div>
        )}

        {error && (
          <div style={{ background: "#ffe5e5", color: "#ff3b3b", padding: "0.8rem", borderRadius: 10, marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: "#e9fbe9", color: "#1d7c35", padding: "0.8rem", borderRadius: 10, marginBottom: "1rem" }}>
            {success}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <label className="small-muted" style={{ color: mutedColor }}>
            Email
          </label>
          <input
            className="input mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              background: darkMode ? "#0f0f23" : "#fff",
              color: textColor,
              borderColor: darkMode ? "#333" : "#ddd",
            }}
          />

          <label className="small-muted mt-1" style={{ color: mutedColor }}>
            OTP
          </label>
          <input
            className="input mt-1"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            inputMode="numeric"
            maxLength={6}
            style={{
              background: darkMode ? "#0f0f23" : "#fff",
              color: textColor,
              borderColor: darkMode ? "#333" : "#ddd",
              letterSpacing: "0.3rem",
              textAlign: "center",
              fontWeight: 700,
            }}
          />

          <div style={{ marginTop: "1.2rem" }}>
            <ActionButton type="submit" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </ActionButton>
          </div>
        </form>

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            style={{
              border: "none",
              background: "transparent",
              color: "#6759FF",
              fontWeight: 600,
              cursor: resendLoading ? "not-allowed" : "pointer",
              marginRight: "0.75rem",
            }}
          >
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>
          <button
            type="button"
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
