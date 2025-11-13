import React, { useState, useEffect } from "react";
import CalendarView from "../components/CalendarView";
import MeetingCard from "../components/MeetingCard";
import ActionButton from "../components/ActionButton";
import { apiGet } from "../api";

export default function Dashboard() {
  // Current date → YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const [meetings, setMeetings] = useState([]);
  const [noteText, setNoteText] = useState("");

  // --------------------------
  // 🔄 Load Meetings for selected date
  // --------------------------
  useEffect(() => {
    async function loadMeetings() {
      try {
        console.log("Fetching meetings for:", selectedDate);

        const res = await apiGet(`/meetings?date=${selectedDate}`);

        console.log("API Response:", res);

        // Backend returns:  [{ date:"2025-11-26", meetings:[ ... ] }]
        if (Array.isArray(res) && res.length > 0) {
          setMeetings(res[0].meetings || []);
        } else {
          setMeetings([]);
        }
      } catch (err) {
        console.error("Error loading meetings:", err);
      }
    }

    if (selectedDate) loadMeetings();
  }, [selectedDate]);

  // --------------------------
  // 📝 Load notes for date
  // --------------------------
  useEffect(() => {
    const key = `note_${selectedDate}`;
    setNoteText(localStorage.getItem(key) || "");
  }, [selectedDate]);

  // --------------------------
  // 💾 Save Notes
  // --------------------------
  function saveNote() {
    const key = `note_${selectedDate}`;
    localStorage.setItem(key, noteText);
    alert("✅ Notes saved!");
  }

  return (
    <div
      className="container"
      style={{
        minHeight: "100vh",
        background: "#F8F9FF",
        paddingTop: "6rem",
        paddingBottom: "2rem",
      }}
    >
      <div
        className="meetings-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "2rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* ====================== 🗓 CALENDAR ====================== */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            padding: "1.5rem",
          }}
        >
          <h2 style={{ marginBottom: "1rem", color: "#1E1E2F" }}>
            Calendar
          </h2>

          <CalendarView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* ====================== 📅 MEETINGS + NOTES ====================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div
            className="card"
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "1.5rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 600, color: "#1E1E2F" }}>
                Meetings for {selectedDate}
              </div>
              <div style={{ color: "#606074", fontSize: "0.9rem" }}>
                {meetings.length} meetings
              </div>
            </div>

            {/* Meeting List */}
            <div className="mt-2" style={{ marginTop: "1rem" }}>
              {meetings.length > 0 ? (
                meetings.map((m) => (
                  <div key={m.id} style={{ marginBottom: 10 }}>
                    <MeetingCard
                      meeting={{
                        id: m.id,
                        title: m.title,
                        agenda: m.agenda,
                        start: m.scheduled_start,
                        end: m.scheduled_end,
                        owner: m.owner_id,
                      }}
                    />
                  </div>
                ))
              ) : (
                <p style={{ color: "#999" }}>No meetings scheduled.</p>
              )}
            </div>

            {/* ====================== 📝 NOTES ====================== */}
            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1.2rem",
                borderTop: "1px solid #eee",
              }}
            >
              <h3
                style={{
                  marginBottom: "0.5rem",
                  color: "#1E1E2F",
                  fontSize: "1.1rem",
                }}
              >
                📝 Notes for {selectedDate}
              </h3>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your notes..."
                style={{
                  width: "100%",
                  height: "160px",
                  padding: "1rem",
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  resize: "none",
                  fontSize: "1rem",
                  outlineColor: "#6759FF",
                }}
              />

              <button
                onClick={saveNote}
                style={{
                  marginTop: "0.8rem",
                  padding: "0.75rem",
                  width: "100%",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg,#6759FF,#A79BFF)",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                💾 Save Notes
              </button>
            </div>
          </div>

          {/* ====================== ⚡ QUICK ACTIONS ====================== */}
          <div
            className="card"
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "1.5rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontWeight: 600, color: "#1E1E2F" }}>
              Quick Actions
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <ActionButton onClick={() => (window.location.href = "/instant")}>
                Instant Meeting
              </ActionButton>

              <ActionButton
                variant="ghost"
                onClick={() => (window.location.href = "/schedule")}
              >
                Schedule Meeting
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
