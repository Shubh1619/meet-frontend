import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const nav = useNavigate();

  // If already logged in → go to dashboard
  useEffect(() => {
    if (localStorage.getItem("token")) {
      nav("/login");
    }
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
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
      localStorage.setItem("token", data.access_token);

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
          Welcome Back 👋
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
          <label className="small-muted">Email</label>
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
              {loading ? "Logging in..." : "Login"}
            </ActionButton>
          </div>
        </form>

        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#606074" }}>
          Don’t have an account?{" "}
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
