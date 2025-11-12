import React from "react";

export default function MeetingCard({ meeting }) {
  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: 12,
        background: "#F8F9FF",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontWeight: 600, color: "#1E1E2F" }}>{meeting.title}</div>
      <div style={{ fontSize: "0.9rem", color: "#606074", marginTop: 4 }}>
        📅 {meeting.time}
      </div>
      <div style={{ fontSize: "0.9rem", color: "#606074", marginTop: 2 }}>
        📍 {meeting.location}
      </div>
    </div>
  );
}
