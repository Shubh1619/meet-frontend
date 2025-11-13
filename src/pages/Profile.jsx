import React from "react";

export default function Profile() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div
      style={{
        paddingTop: "6rem",
        minHeight: "100vh",
        background: "#F8F9FF",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "2rem",
          borderRadius: 16,
          width: "100%",
          maxWidth: 500,
          boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ color: "#1E1E2F", marginBottom: 20 }}>User Profile</h2>

        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>

        <div style={{ marginTop: 30 }}>
          <button
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              background: "#6759FF",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Edit Profile (coming soon)
          </button>
        </div>
      </div>
    </div>
  );
}
