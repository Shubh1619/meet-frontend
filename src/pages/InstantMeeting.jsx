import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";

export default function InstantMeeting() {
  const [topic, setTopic] = useState("");
  const [agenda, setAgenda] = useState("");
  const [participants, setParticipants] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const nav = useNavigate();

  function createInstant(e) {
    e.preventDefault();

    const id = "inst-" + Math.random().toString(36).slice(2, 9);
    const link = `${window.location.origin}/meeting/${id}`;

    const payload = {
      topic,
      agenda,
      participants: participants
        ? participants.split(",").map((p) => p.trim()).filter(Boolean)
        : [],
    };

    console.log("✅ Meeting Created:", payload);
    setMeetingLink(link);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(meetingLink);
    alert("✅ Meeting link copied to clipboard!");
  }

  function joinMeeting() {
    if (meetingLink) nav(meetingLink.replace(window.location.origin, ""));
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F9FF",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "6rem", // added top spacing for fixed navbar
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "3rem 2.5rem",
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        {/* 💜 Logo Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            marginBottom: "1.5rem",
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

        {!meetingLink ? (
          <>
            <h2 style={{ color: "#1E1E2F", marginBottom: "0.5rem" }}>
              Create Instant Meeting ⚡
            </h2>
            <p style={{ color: "#606074", marginBottom: "2rem" }}>
              Set up a quick meeting and share the link instantly.
            </p>

            <form onSubmit={createInstant} style={{ textAlign: "left" }}>
              {/* Topic */}
              <label style={{ fontSize: "0.9rem", color: "#606074" }}>
                Meeting Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Project Kickoff"
                style={{
                  width: "100%",
                  marginTop: 6,
                  marginBottom: 14,
                  padding: "0.75rem",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  fontSize: "1rem",
                  outlineColor: "#6759FF",
                }}
                required
              />

              {/* Agenda */}
              <label style={{ fontSize: "0.9rem", color: "#606074" }}>
                Agenda
              </label>
              <textarea
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="Discuss project roadmap, milestones, and design overview."
                style={{
                  width: "100%",
                  marginTop: 6,
                  marginBottom: 14,
                  padding: "0.75rem",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  fontSize: "1rem",
                  outlineColor: "#6759FF",
                  resize: "none",
                  minHeight: "90px",
                }}
                required
              />

              {/* Participants */}
              <label style={{ fontSize: "0.9rem", color: "#606074" }}>
                Participants <span style={{ color: "#999" }}>(optional)</span>
              </label>
              <input
                type="text"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Enter emails separated by commas"
                style={{
                  width: "100%",
                  marginTop: 6,
                  marginBottom: 24,
                  padding: "0.75rem",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  fontSize: "1rem",
                  outlineColor: "#6759FF",
                }}
              />

              <ActionButton
                type="submit"
                style={{
                  width: "100%",
                  padding: "0.9rem 2rem",
                  fontSize: "1.1rem",
                  borderRadius: "10px",
                }}
              >
                Create Instant Meeting
              </ActionButton>
            </form>
          </>
        ) : (
          <>
            <h2 style={{ color: "#1E1E2F", marginBottom: "0.5rem" }}>
              Meeting Created 🎉
            </h2>
            <p style={{ color: "#606074", marginBottom: "1.5rem" }}>
              Share this link with participants to join instantly:
            </p>

            {/* Meeting Link Display */}
            <div
              style={{
                background: "#F8F9FF",
                padding: "0.75rem 1rem",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid rgba(0,0,0,0.05)",
                marginBottom: "1.5rem",
              }}
            >
              <span
                style={{
                  color: "#1E1E2F",
                  fontSize: "0.9rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {meetingLink}
              </span>
              <button
                onClick={copyToClipboard}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6759FF",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginLeft: "0.5rem",
                }}
              >
                Copy
              </button>
            </div>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                gap: "0.8rem",
                justifyContent: "center",
              }}
            >
              <ActionButton
                onClick={joinMeeting}
                style={{ flex: 1, padding: "0.8rem" }}
              >
                Join Now
              </ActionButton>
              <ActionButton
                variant="ghost"
                onClick={() => setMeetingLink("")}
                style={{ flex: 1, padding: "0.8rem" }}
              >
                New Meeting
              </ActionButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
