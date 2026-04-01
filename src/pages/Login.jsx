import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import ActionButton from "../components/ActionButton";
import { useDarkMode } from "../context/DarkModeContext";
import { popAuthMessage, setAuthSession } from "../authSession";

export default function Login() {
  const { darkMode } = useDarkMode();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const nav = useNavigate();
  const location = useLocation();

  const cardBg = darkMode ? "#16213e" : "#fff";
  const bgColor = darkMode ? "#1a1a2e" : "#F8F9FF";
  const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";
  const mutedColor = darkMode ? "#888" : "#606074";

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
    setLoading(true);

    try {
      const form = new URLSearchParams();
      form.append("grant_type", "password");
      form.append("username", email);
      form.append("password", pass);
      form.append("scope", "");
      form.append("client_id", "string");
      form.append("client_secret", "string");

      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Invalid Credentials");
      }

      const data = await res.json();

      // Save JWT securely
      setAuthSession(data.access_token, data.refresh_token || null);

      // Fetch user info and save to localStorage
      try {
        const userRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/user`, {
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
    } catch (error) {
      setErr(error.message);
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

        <form onSubmit={submit} style={{ textAlign: "left" }}>
          <label className="small-muted" style={{ color: mutedColor }}>Email</label>
          <input
            className="input mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ background: darkMode ? "#0f0f23" : "#fff", color: textColor, borderColor: darkMode ? "#333" : "#ddd" }}
          />

          <label className="small-muted mt-1" style={{ color: mutedColor }}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              className="input mt-1"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
              style={{ background: darkMode ? "#0f0f23" : "#fff", color: textColor, borderColor: darkMode ? "#333" : "#ddd", width: "100%", paddingRight: "45px" }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: mutedColor,
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

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
    </div>
  );
}
