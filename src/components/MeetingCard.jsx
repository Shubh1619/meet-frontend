import React, { useEffect, useState } from "react";
import { apiGet } from "../api";

export default function MeetingCard({ meeting }) {
  const [owner, setOwner] = useState(null);

  useEffect(() => {
    async function loadOwner() {
      try {
        const res = await apiGet(`/user/${meeting.owner_id}`);
        setOwner(res);
      } catch (err) {
        console.error("Failed to load owner:", err);
      }
    }

    if (meeting.owner_id) loadOwner();
  }, [meeting.owner_id]);

  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: 12,
        border: "1px solid #eee",
        background: "#FAFAFF",
      }}
    >
      {/* Title */}
      <h3 style={{ margin: 0 }}>{meeting.title}</h3>

      {/* Agenda */}
      <p style={{ margin: "6px 0", color: "#555" }}>{meeting.agenda}</p>

      {/* Date & Time */}
      <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#6759FF" }}>
        🕒 {meeting.scheduled_start.replace("T", " ")}
      </p>

      {/* Owner */}
      <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#444" }}>
        👤 Scheduled by:{" "}
        <strong>{owner ? owner.name : "Loading..."}</strong>
      </p>

      {/* Meeting Link */}
      {meeting.meeting_link && (
        <a
          href={meeting.meeting_link}
          target="_blank"
          style={{
            marginTop: "6px",
            display: "inline-block",
            fontSize: "0.9rem",
            color: "#6759FF",
          }}
        >
          🔗 Join Meeting
        </a>
      )}
    </div>
  );
}
