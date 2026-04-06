import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import { apiPost } from "../api";
import { useDarkMode } from "../context/DarkModeContext";
import { useToast } from "../components/ToastProvider";
import { focusFirstInvalidField, parseCommaSeparatedEmails } from "../utils/formUtils";
import AppPopup from "../components/AppPopup";

const PUBLIC_MEETING_BASE = (import.meta.env.VITE_PUBLIC_APP_URL || "https://meet-frontend-4op.pages.dev")
  .trim()
  .replace(/\/$/, "");

function normalizeJoinLink(rawJoinLink, roomId) {
  if (!rawJoinLink && roomId) {
    return `${PUBLIC_MEETING_BASE}/meeting/${roomId}`;
  }

  if (!rawJoinLink) return "";

  try {
    const parsed = new URL(rawJoinLink);
    const isLocal =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "0.0.0.0";

    if (!isLocal) return rawJoinLink;

    return `${PUBLIC_MEETING_BASE}${parsed.pathname}`;
  } catch {
    return rawJoinLink;
  }
}

export default function InstantMeeting() {
  const { darkMode } = useDarkMode();
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [participants, setParticipants] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const toast = useToast();

  const nav = useNavigate();

  // Auth check
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      nav("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.classList.add("hide-route-scrollbar");
    document.documentElement.classList.add("hide-route-scrollbar");
    return () => {
      document.body.classList.remove("hide-route-scrollbar");
      document.documentElement.classList.remove("hide-route-scrollbar");
    };
  }, []);

  const cardBg = darkMode ? "#16213e" : "#fff";
  const bgColor = darkMode ? "#1a1a2e" : "#F8F9FF";
  const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";
  const mutedColor = darkMode ? "#888" : "#606074";
  const borderColor = darkMode ? "#333" : "#ddd";
  const inputBg = darkMode ? "#0f0f23" : "#fff";

  async function createInstant(e) {
    e.preventDefault();
    setFieldErrors({});
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = "Title is required.";
    if (!agenda.trim()) nextErrors.agenda = "Agenda is required.";

    const { emails: participantEmails, invalidEmails } = parseCommaSeparatedEmails(participants);
    if (invalidEmails.length) {
      nextErrors.participants = `Invalid email(s): ${invalidEmails.join(", ")}`;
    }

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      focusFirstInvalidField(e.currentTarget);
      return;
    }
    setLoading(true);

    const payload = {
      title,
      agenda,
      participants: participantEmails,
    };

    try {
      const res = await apiPost("/instant", payload);

      // BACKEND RESPONSE:
      // {
      //   msg: "...",
      //   meeting_id: 15,
      //   join_link: "https://....",
      //   participants: []
      // }

      const roomId = res.room_id || res.join_link?.match(/\/meeting\/([^/]+)/)?.[1];
      setMeetingLink(normalizeJoinLink(res.join_link, roomId));
      setRoomId(roomId || "");
      if (roomId && res.host_session_id) {
        sessionStorage.setItem(`meeting-host-session:${roomId}`, res.host_session_id);
      }
    } catch (err) {
      toast.error(err.message || "Unable to create instant meeting.");
    }

    setLoading(false);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(meetingLink);
    toast.success("Meeting link copied.");
  }
  async function addParticipant() {
    const { emails: invitees, invalidEmails } = parseCommaSeparatedEmails(inviteInput);

    if (!invitees.length) {
      toast.warning("Please enter at least one valid email.");
      return;
    }

    if (invalidEmails.length) {
      toast.error(`Invalid email(s): ${invalidEmails.join(", ")}`);
      return;
    }

    const targetRoomId = roomId || meetingLink.match(/\/meeting\/([^/]+)/)?.[1];
    if (!targetRoomId) {
      toast.error("Meeting room not found.");
      return;
    }

    try {
      const res = await apiPost(`/instant/${targetRoomId}/invite`, { participants: invitees });
      toast.success(res?.msg || "Invitation sent.");
      setShowInvitePopup(false);
      setInviteInput("");
    } catch (error) {
      toast.error(error.message || "Failed to send invitation.");
    }
  }
  function joinMeeting() {
    if (!meetingLink) return;

    // Extract room ID from URL path: /meeting/{roomId}
    const match = meetingLink.match(/\/meeting\/([^/]+)/);
    if (match) {
      nav(`/meeting/${match[1]}`);
    }
  }

  return (
    <div
      className="instant-page"
      style={{
        minHeight: "calc(100vh - 60px)",
        background: bgColor,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "5rem",
        width: "100%",
        paddingLeft: "1rem",
        paddingRight: "1rem",
      }}
    >
      <div
        style={{
          background: cardBg,
          borderRadius: 16,
          padding: "3rem 2.5rem",
          maxWidth: 520,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo Section */}
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
            Meeting Platform
          </div>
        </div>

        {/* BEFORE MEETING CREATION */}
        {!meetingLink ? (
          <>
            <h2 style={{ color: textColor, marginBottom: "0.5rem" }}>
              Create Instant Meeting ⚡
            </h2>
            <p style={{ color: mutedColor, marginBottom: "2rem" }}>
              Quickly launch a meeting link and share it instantly!
            </p>

            <form onSubmit={createInstant} style={{ textAlign: "left" }}>
              {/* Title */}
              <label className="required-label" style={{ fontSize: "0.9rem", color: mutedColor }}>
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-invalid={fieldErrors.title ? "true" : "false"}
                placeholder="e.g. Team Sync"
                style={{ ...inputStyle, background: inputBg, color: textColor, borderColor: fieldErrors.title ? "#dc2626" : borderColor }}
                required
              />
              {fieldErrors.title && <div className="field-error">{fieldErrors.title}</div>}

              {/* Agenda */}
              <label className="required-label" style={{ fontSize: "0.9rem", color: mutedColor }}>
                Agenda
              </label>
              <textarea
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                data-invalid={fieldErrors.agenda ? "true" : "false"}
                placeholder="Describe meeting agenda..."
                style={{
                  ...inputStyle,
                  height: "90px",
                  resize: "none",
                  background: inputBg,
                  color: textColor,
                  borderColor: fieldErrors.agenda ? "#dc2626" : borderColor,
                }}
                required
              ></textarea>
              {fieldErrors.agenda && <div className="field-error">{fieldErrors.agenda}</div>}

              {/* Participants (Optional) */}
              <label style={{ fontSize: "0.9rem", color: mutedColor }}>
                Participants <span style={{ color: darkMode ? "#666" : "#999" }}>(optional)</span>
              </label>
              <input
                type="text"
                value={participants}
                onChange={(e) => {
                  setParticipants(e.target.value);
                  setFieldErrors((prev) => {
                    if (!prev.participants) return prev;
                    const next = { ...prev };
                    delete next.participants;
                    return next;
                  });
                }}
                data-invalid={fieldErrors.participants ? "true" : "false"}
                placeholder="Enter emails separated by commas"
                style={{
                  ...inputStyle,
                  background: inputBg,
                  color: textColor,
                  borderColor: fieldErrors.participants ? "#dc2626" : borderColor,
                }}
              />
              {fieldErrors.participants && <div className="field-error">{fieldErrors.participants}</div>}

              <ActionButton
                type="submit"
                style={{ width: "100%", padding: "0.9rem", fontSize: "1.1rem" }}
              >
                {loading ? "Creating..." : "Create Meeting"}
              </ActionButton>
            </form>
          </>
        ) : (
          <>
            {/* AFTER MEETING CREATED */}
            <h2 style={{ color: textColor, marginBottom: "1rem" }}>
              Meeting Created 🎉
            </h2>
            <p style={{ color: mutedColor, marginBottom: "1.2rem" }}>
              Share this link with participants:
            </p>

            {/* Display Link */}
            <div style={{ ...linkBoxStyle, background: darkMode ? "#0f0f23" : "#F8F9FF" }}>
              <span
                style={{
                  flex: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: textColor,
                }}
              >
                {meetingLink}
              </span>

              <button onClick={copyToClipboard} style={copyBtnStyle}>
                Copy
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "0.8rem", marginTop: "1rem" }}>
              <ActionButton
                onClick={joinMeeting}
                style={{ flex: 1, padding: "0.8rem" }}
              >
                Join Now
              </ActionButton>

              <ActionButton
                variant="ghost"
                onClick={() => setShowInvitePopup(true)}
                style={{ flex: 1, padding: "0.8rem" }}
              >Add Participant</ActionButton>
            </div>
          </>
        )}
      </div>

      <AppPopup
        open={showInvitePopup}
        title="Invite Participants"
        message="Add email addresses separated by commas."
        confirmLabel="Send Invite"
        cancelLabel="Cancel"
        confirmVariant="primary"
        onConfirm={addParticipant}
        onCancel={() => {
          setShowInvitePopup(false);
          setInviteInput("");
        }}
      >
        <input
          className="app-popup-input"
          placeholder="name1@email.com, name2@email.com"
          value={inviteInput}
          onChange={(e) => setInviteInput(e.target.value)}
        />
      </AppPopup>
    </div>
  );
}

/* -------------------------------------------
   Inline Styles
------------------------------------------- */

const inputStyle = {
  width: "100%",
  marginTop: 6,
  marginBottom: 16,
  padding: "0.75rem",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontSize: "1rem",
  outlineColor: "#6759FF",
};

const linkBoxStyle = {
  background: "#F8F9FF",
  padding: "0.75rem 1rem",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.08)",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const copyBtnStyle = {
  background: "none",
  border: "none",
  color: "#6759FF",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: "pointer",
};



