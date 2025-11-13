import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const nav = useNavigate();

  // 🚀 If already logged in → redirect to dashboard
  useEffect(() => {
    if (localStorage.getItem("token")) {
      nav("/register");
    }
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const payload = { name, email, password: pass };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
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

      // Registration successful → auto login
      const loginForm = new URLSearchParams();
      loginForm.append("grant_type", "password");
      loginForm.append("username", email);
      loginForm.append("password", pass);
      loginForm.append("scope", "");
      loginForm.append("client_id", "string");
      loginForm.append("client_secret", "string");

      const loginRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: loginForm,
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        throw new Error(loginData.detail || "Auto login failed");
      }

      // Save token
      localStorage.setItem("token", loginData.access_token);

      nav("/dashboard");
    } catch (error) {
      setErr(error.message);
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F9FF",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: "6rem",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "#fff",
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
            Meetify
          </div>
        </div>

        <h2 style={{ marginBottom: "0.5rem", color: "#1E1E2F" }}>
          Create Your Account ✨
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

        <form onSubmit={submit} style={{ textAlign: "left" }}>
          <label className="small-muted">Name</label>
          <input
            className="input mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className="small-muted mt-1">Email</label>
          <input
            className="input mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="small-muted mt-1">Password</label>
          <input
            type="password"
            className="input mt-1"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
          />

          <div style={{ marginTop: "1.5rem" }}>
            <ActionButton type="submit" style={{ width: "100%" }}>
              {loading ? "Creating..." : "Create Account"}
            </ActionButton>
          </div>
        </form>

        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#606074" }}>
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
