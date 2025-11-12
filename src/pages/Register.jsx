import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const nav = useNavigate();

  function submit(e) {
    e.preventDefault();
    // TODO: register API
    nav("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F9FF",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: "6rem", // accounts for navbar height
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
        {/* Logo and Title */}
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

        <h2 style={{ margin: "0 0 0.5rem 0", color: "#1E1E2F" }}>
          Create Your Account ✨
        </h2>
        <p style={{ color: "#606074", marginBottom: "2rem" }}>
          Join Meetify and start managing smarter meetings
        </p>

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
              Create Account
            </ActionButton>
          </div>
        </form>

        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#606074" }}>
          Already have an account?{" "}
          <span
            style={{
              color: "#6759FF",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => nav("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
