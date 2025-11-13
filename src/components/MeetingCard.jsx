import React from "react";

export default function MeetingCard({ meeting }) {
  return (
    <div
      style={{
        background: "#F8F9FF",
        padding: "1rem",
        borderRadius: 12,
        border: "1px solid #eee",
      }}
    >
      <h3 style={{ margin: 0, color: "#1E1E2F" }}>{meeting.title}</h3>

      <p style={{ margin: "6px 0", color: "#606074" }}>
        📄 <b>Agenda:</b> {meeting.agenda}
      </p>

      <p style={{ margin: "6px 0", color: "#606074" }}>
        🗓 <b>Date:</b> {new Date(meeting.start).toLocaleDateString()}
      </p>

      <p style={{ margin: "6px 0", color: "#606074" }}>
        🕒 <b>Time:</b>{" "}
        {new Date(meeting.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
        {new Date(meeting.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>

      <p style={{ margin: "6px 0", color: "#606074" }}>
        👤 <b>Owner (User ID):</b> {meeting.owner}
      </p>
    </div>
  );
}
