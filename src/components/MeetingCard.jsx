import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiDelete } from "../api";
import { useDarkMode } from "../context/DarkModeContext";
import { FaLink, FaUser, FaCopy, FaTrash } from "react-icons/fa";

export default function MeetingCard({ meeting, onDelete }) {
  const { darkMode } = useDarkMode();
  const [owner, setOwner] = useState(
    meeting?.owner_name
      ? { name: meeting.owner_name, email: meeting.owner_email || "" }
      : null
  );
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadOwner() {
      try {
        const res = await apiGet(`/user/${meeting.owner_id}`);
        setOwner(res);
      } catch (err) {
        console.error("Failed to load owner:", err);
      }
    }

    if (meeting.owner_name) {
      setOwner({ name: meeting.owner_name, email: meeting.owner_email || "" });
      return;
    }

    if (meeting.owner_id) loadOwner();
  }, [meeting.owner_id, meeting.owner_name, meeting.owner_email]);

  const cardBg = darkMode ? "#16213e" : "#FAFAFF";
  const borderColor = darkMode ? "#333" : "#eee";
  const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";
  const mutedColor = darkMode ? "#888" : "#555";

  // Extract room ID from meeting_link
  const roomId = meeting.room_id || meeting.meeting_link?.split("/meeting/")[1]?.split("?")[0];

  // Generate meeting URL
  const meetingUrl = roomId ? `${window.location.origin}/meeting/${roomId}` : "";

  const handleCopyLink = () => {
    if (meetingUrl) {
      navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this scheduled meeting?")) {
      return;
    }

    setDeleting(true);
    try {
      await apiDelete(`/meetings/${meeting.id}`);
      if (onDelete) onDelete(meeting.id);
    } catch (err) {
      console.error("Failed to delete meeting:", err);
      alert("Failed to delete meeting");
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = typeof meeting.can_delete === "boolean"
    ? meeting.can_delete
    : (meeting.meeting_type === "regular" && meeting.role === "owner");

  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: 12,
        border: `1px solid ${borderColor}`,
        background: cardBg,
      }}
    >
      {/* Title */}
      <h3 style={{ margin: 0, color: textColor }}>{meeting.title}</h3>

      {/* Agenda */}
      <p style={{ margin: "6px 0", color: mutedColor }}>{meeting.agenda}</p>

      {/* Date & Time */}
      <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#6759FF" }}>
        {meeting.scheduled_start 
          ? (() => {
              const d = new Date(meeting.scheduled_start);
              return d.toLocaleString('en-US', { 
                dateStyle: 'medium', 
                timeStyle: 'short',
                hour12: true 
              });
            })()
          : "Instant meeting"}
      </p>

      {/* Owner */}
      <p style={{ margin: "4px 0", fontSize: "0.9rem", color: mutedColor }}>
        <FaUser style={{ marginRight: 4, fontSize: "0.8rem" }} />
        Scheduled by:{" "}
        <strong style={{ color: textColor }}>{owner ? owner.name : "Loading..."}</strong>
      </p>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        {/* Copy Link Button */}
        {roomId && (
          <button
            onClick={handleCopyLink}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              fontSize: "0.85rem",
              color: "#fff",
              background: copied ? "#4CAF50" : "#6759FF",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            <FaCopy style={{ fontSize: "0.85rem" }} />
            {copied ? "Copied!" : "Copy Link"}
          </button>
        )}

        {/* Join Button */}
        {roomId && (
          <button
            onClick={() => navigate(`/meeting/${roomId}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              fontSize: "0.85rem",
              color: "#6759FF",
              background: "transparent",
              border: `1px solid #6759FF`,
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            <FaLink style={{ fontSize: "0.85rem" }} />
            Join
          </button>
        )}

        {/* Delete Button - Only for scheduled (regular) meetings */}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              fontSize: "0.85rem",
              color: "#fff",
              background: deleting ? "#999" : "#FF4757",
              border: "none",
              borderRadius: 8,
              cursor: deleting ? "not-allowed" : "pointer",
              fontWeight: 500,
              transition: "all 0.2s",
              marginLeft: "auto",
            }}
          >
            <FaTrash style={{ fontSize: "0.85rem" }} />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}
