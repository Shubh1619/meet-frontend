import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import PasswordInput from "../components/PasswordInput";
import { useDarkMode } from "../context/DarkModeContext";
import { API_BASE } from "../api";
import { useToast } from "../components/ToastProvider";
import { focusFirstInvalidField } from "../utils/formUtils";

export default function Register() {
  const { darkMode } = useDarkMode();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const toast = useToast();

  const nav = useNavigate();

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

  // If already logged in, redirect to dashboard.
  useEffect(() => {
    if (localStorage.getItem("token")) {
      nav("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setFieldErrors({});

    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Name is required.";
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (!pass.trim()) nextErrors.password = "Password is required.";
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      focusFirstInvalidField(e.currentTarget);
      return;
    }

    setLoading(true);

    try {
      const payload = { name, email, password: pass };

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      sessionStorage.setItem("pending_verification_email", email.trim().toLowerCase());
      nav("/verify-email", {
        state: {
          message:
            data.message ||
            "Registration successful. Enter the OTP sent to your email to verify your account.",
        },
      });
      toast.success("Account created. Verify your email OTP.");
    } catch (error) {
      setErr(error.message);
      toast.error(error.message || "Registration failed.");
    }

    setLoading(false);
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
          Create Your Account
        </h2>

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
          <label className="small-muted required-label" style={{ color: mutedColor }}>
            Name
          </label>
          <input
            className={`input mt-1 ${fieldErrors.name ? "border-red-500" : ""}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
            }}
            data-invalid={fieldErrors.name ? "true" : "false"}
            aria-invalid={fieldErrors.name ? "true" : "false"}
            style={{
              background: darkMode ? "#0f0f23" : "#fff",
              color: textColor,
              borderColor: fieldErrors.name ? "#ef4444" : (darkMode ? "#333" : "#ddd"),
            }}
          />
          {fieldErrors.name && <div className="text-red-500 text-sm mt-1" style={{ color: "#ef4444" }}>{fieldErrors.name}</div>}

          <label className="small-muted mt-1 required-label" style={{ color: mutedColor }}>
            Email
          </label>
          <input
            className={`input mt-1 ${fieldErrors.email ? "border-red-500" : ""}`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            data-invalid={fieldErrors.email ? "true" : "false"}
            aria-invalid={fieldErrors.email ? "true" : "false"}
            style={{
              background: darkMode ? "#0f0f23" : "#fff",
              color: textColor,
              borderColor: fieldErrors.email ? "#ef4444" : (darkMode ? "#333" : "#ddd"),
            }}
          />
          {fieldErrors.email && <div className="text-red-500 text-sm mt-1" style={{ color: "#ef4444" }}>{fieldErrors.email}</div>}

          <label className="small-muted mt-1 required-label" style={{ color: mutedColor }}>
            Password
          </label>
          <PasswordInput
            className={`input mt-1 ${fieldErrors.password ? "border-red-500" : ""}`}
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              clearFieldError("password");
            }}
            data-invalid={fieldErrors.password ? "true" : "false"}
            aria-invalid={fieldErrors.password ? "true" : "false"}
            style={{
              background: darkMode ? "#0f0f23" : "#fff",
              color: textColor,
              borderColor: fieldErrors.password ? "#ef4444" : (darkMode ? "#333" : "#ddd"),
              width: "100%",
            }}
            iconClassName={darkMode ? "text-slate-300" : "text-slate-500"}
          />
          {fieldErrors.password && <div className="text-red-500 text-sm mt-1" style={{ color: "#ef4444" }}>{fieldErrors.password}</div>}

          <div style={{ marginTop: "1.5rem" }}>
            <ActionButton type="submit" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </ActionButton>
          </div>
        </form>

        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: mutedColor }}>
          Already have an account?{" "}
          <span
            style={{ color: "#6759FF", fontWeight: 600, cursor: "pointer" }}
            onClick={() => nav("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

