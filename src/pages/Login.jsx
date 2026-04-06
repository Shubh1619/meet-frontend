import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import PasswordInput from "../components/PasswordInput";
import { useDarkMode } from "../context/DarkModeContext";
import { popAuthMessage, setAuthSession } from "../authSession";
import { API_BASE, getApiErrorMessage } from "../api";
import { useToast } from "../components/ToastProvider";
import { focusFirstInvalidField, isValidEmail } from "../utils/formUtils";
import AppPopup from "../components/AppPopup";

export default function Login() {
  const { darkMode } = useDarkMode();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const toast = useToast();

  const nav = useNavigate();
  const location = useLocation();

  const cardBg = darkMode ? "#16213e" : "#fff";
  const bgColor = darkMode ? "#1a1a2e" : "#F8F9FF";
  const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";
  const mutedColor = darkMode ? "#888" : "#606074";

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // If already logged in → go to dashboard
  useEffect(() => {
    if (localStorage.getItem("token")) {
      nav("/dashboard");
    }
    if (location.state?.message) {
      setInfo(location.state.message);
    } else {
      const msg = popAuthMessage();
      if (msg) setInfo(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setInfo("");
    setFieldErrors({});

    const nextErrors = {};
    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Invalid email. Please include '@' (example: name@example.com).";
    }
    if (!pass.trim()) nextErrors.password = "Password is required.";
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      focusFirstInvalidField(e.currentTarget);
      return;
    }

    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const form = new URLSearchParams();
      form.append("grant_type", "password");
      form.append("username", normalizedEmail);
      form.append("password", pass);
      form.append("scope", "");
      form.append("client_id", "string");
      form.append("client_secret", "string");

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(getApiErrorMessage(errData, "Invalid Credentials"));
      }

      const data = await res.json();

      // Save JWT securely
      setAuthSession(data.access_token, data.refresh_token || null);

      // Fetch user info and save to localStorage
      try {
        const userRes = await fetch(`${API_BASE}/auth/user`, {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setAuthSession(data.access_token, data.refresh_token || null, userData);
        }
      } catch (e) {
        console.error("Failed to fetch user info:", e);
      }

      nav("/dashboard");
      toast.success("Welcome back!");
    } catch (error) {
      const message = error?.message || "Login failed";
      if (message.toLowerCase().includes("verify your email")) {
        const normalized = email.trim().toLowerCase();
        sessionStorage.setItem("pending_verification_email", normalized);
        setPendingEmail(normalized);
        setOtp("");
        setShowOtpPopup(true);
        toast.warning("Email not verified. Enter OTP to continue.");
        setLoading(false);
        return;
      }
      if (message.toLowerCase().includes("failed to fetch")) {
        setErr(`Cannot connect to server at ${API_BASE}. Make sure backend is running.`);
        toast.error("Unable to reach server. Please try again.");
      } else {
        setErr(message);
        toast.error(message);
      }
    }

    setLoading(false);
  }

  async function verifyOtpFromLogin() {
    const normalized = (pendingEmail || email || "").trim().toLowerCase();
    const code = otp.trim();
    if (!normalized) {
      toast.error("Email is missing for OTP verification.");
      return;
    }
    if (!code) {
      toast.warning("Please enter OTP.");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, otp: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(data, "OTP verification failed."));
      toast.success(data.message || "Email verified. Please login.");
      setShowOtpPopup(false);
      setOtp("");
    } catch (e) {
      toast.error(e?.message || "OTP verification failed.");
    } finally {
      setOtpLoading(false);
    }
  }

  async function resendOtpFromLogin() {
    const normalized = (pendingEmail || email || "").trim().toLowerCase();
    if (!normalized) {
      toast.error("Email is required to resend OTP.");
      return;
    }
    setResendLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorMessage(data, "Failed to resend OTP."));
      toast.info(data.message || "OTP resent.");
    } catch (e) {
      toast.error(e?.message || "Failed to resend OTP.");
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
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: cardBg,
          borderRadius: 16,
          padding: "2.5rem 2rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            marginBottom: "1.2rem",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "linear-gradient(135deg, #6759FF, #A79BFF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#6759FF" }}>
            Meeting Platform
          </div>
        </div>

        <h2 style={{ marginBottom: "0.5rem", color: textColor }}>
          Welcome Back 👋
        </h2>

        {info && (
          <div
            style={{
              background: "#e9fbe9",
              color: "#1d7c35",
              padding: "0.8rem",
              borderRadius: 10,
              marginBottom: "1rem",
            }}
          >
            {info}
          </div>
        )}

        {err && (
          <div
            style={{
              background: "#ffe5e5",
              color: "#ff3b3b",
              padding: "0.8rem",
              borderRadius: 10,
              marginBottom: "1rem",
            }}
          >
            {err}
          </div>
        )}

        <form onSubmit={submit} noValidate style={{ textAlign: "left" }}>
          <label className="small-muted required-label" style={{ color: mutedColor }}>Email</label>
          <input
            className={`input mt-1 ${fieldErrors.email ? "border-red-500" : ""}`}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            data-invalid={fieldErrors.email ? "true" : "false"}
            aria-invalid={fieldErrors.email ? "true" : "false"}
            style={{ background: darkMode ? "#0f0f23" : "#fff", color: textColor, borderColor: fieldErrors.email ? "#ef4444" : (darkMode ? "#333" : "#ddd") }}
          />
          {fieldErrors.email && <div className="text-red-500 text-sm mt-1" style={{ color: "#ef4444" }}>{fieldErrors.email}</div>}

          <label className="small-muted mt-1 required-label" style={{ color: mutedColor }}>Password</label>
          <PasswordInput
            className={`input mt-1 ${fieldErrors.password ? "border-red-500" : ""}`}
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              clearFieldError("password");
            }}
            data-invalid={fieldErrors.password ? "true" : "false"}
            aria-invalid={fieldErrors.password ? "true" : "false"}
            style={{ background: darkMode ? "#0f0f23" : "#fff", color: textColor, borderColor: fieldErrors.password ? "#ef4444" : (darkMode ? "#333" : "#ddd"), width: "100%" }}
            iconClassName={darkMode ? "text-slate-300" : "text-slate-500"}
          />
          {fieldErrors.password && <div className="text-red-500 text-sm mt-1" style={{ color: "#ef4444" }}>{fieldErrors.password}</div>}

          <div style={{ marginTop: "1.5rem" }}>
            <ActionButton type="submit" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </ActionButton>
          </div>

          <div style={{ textAlign: "right", marginTop: "0.8rem" }}>
            <button
              type="button"
              onClick={() => nav("/forgot-password")}
              style={{
                border: "none",
                background: "transparent",
                color: "#6759FF",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Forgot Password?
            </button>
          </div>
        </form>

        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: mutedColor }}>
          Don't have an account?{" "}
          <span
            style={{ color: "#6759FF", fontWeight: 600, cursor: "pointer" }}
            onClick={() => nav("/register")}
          >
            Sign Up
          </span>
        </p>
      </div>
      <AppPopup
        open={showOtpPopup}
        title="Verify Your Email"
        message={`Enter OTP sent to ${pendingEmail || email}.`}
        confirmLabel={otpLoading ? "Verifying..." : "Verify OTP"}
        cancelLabel="Close"
        onConfirm={verifyOtpFromLogin}
        onCancel={() => setShowOtpPopup(false)}
        confirmVariant="primary"
      >
        <input
          className="app-popup-input"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          inputMode="numeric"
          maxLength={6}
        />
        <div style={{ marginTop: 10, textAlign: "right" }}>
          <button
            type="button"
            className="app-popup-btn app-popup-btn-secondary"
            onClick={resendOtpFromLogin}
            disabled={resendLoading}
          >
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>
        </div>
      </AppPopup>
    </div>
  );
}
