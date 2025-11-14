import React, { useState, useEffect } from "react";
import CalendarView from "../components/CalendarView";
import MeetingCard from "../components/MeetingCard";
import ActionButton from "../components/ActionButton";
import { apiGet } from "../api";

export default function Dashboard() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const [meetings, setMeetings] = useState([]);
  const [noteText, setNoteText] = useState("");

  // NEW STATES FOR HIGHLIGHTING DATES
  const [meetingDates, setMeetingDates] = useState([]);
  const [noteDates, setNoteDates] = useState([]);

  // -------------------------------
  // LOAD MEETINGS FOR SELECTED DATE
  // -------------------------------
  useEffect(() => {
    async function loadMeetings() {
      try {
        const res = await apiGet(`/meetings?date=${selectedDate}`);
        setMeetings(res.meetings || []);
      } catch (err) {
        console.error("Error loading meetings:", err);
      }
    }

    loadMeetings();
  }, [selectedDate]);

  // ------------------------------------
  // LOAD MONTH MEETING + NOTE HIGHLIGHTS
  // ------------------------------------
  useEffect(() => {
    async function loadMonthInfo() {
      try {
        const [year, month] = selectedDate.split("-");
        const monthStr = `${year}-${month}`;

        // --- Get meeting dates ---
        const monthMeetings = await apiGet(`/meetings/month?month=${monthStr}`);
        setMeetingDates(monthMeetings.dates || []);

        // --- Get notes dates ---
        const monthNotes = await apiGet(`/notes/month?month=${monthStr}`);
        setNoteDates(monthNotes.dates || []);

      } catch (err) {
        console.error("Failed month load:", err);
      }
    }

    loadMonthInfo();
  }, [selectedDate]);

  // -------------------------------
  // LOAD NOTES FOR SELECTED DATE
  // -------------------------------
  useEffect(() => {
    async function loadNotes() {
      try {
        const res = await apiGet(`/notes/by-date?date=${selectedDate}`);
        setNoteText(res.note || "");
      } catch (err) {
        console.error("Cannot load note, using empty.", err);
        setNoteText("");
      }
    }

    loadNotes();
  }, [selectedDate]);

  // -------------------------------
  // SAVE NOTE
  // -------------------------------
  async function saveNote() {
    try {
      await apiPost("/notes/create", {
        date: selectedDate,
        note: noteText,
      });

      alert("Notes saved!");

      // refresh note dates highlight
      const [year, month] = selectedDate.split("-");
      const monthStr = `${year}-${month}`;
      const monthNotes = await apiGet(`/notes/month?month=${monthStr}`);
      setNoteDates(monthNotes.dates || []);

    } catch (err) {
      console.error("Note save failed", err);
      alert("Error saving note");
    }
  }

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F9FF",
        paddingTop: "6rem",
        paddingBottom: "2rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "2rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* LEFT - CALENDAR */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            padding: "1.5rem",
          }}
        >
          <h2>Calendar</h2>

          <CalendarView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            meetingDates={meetingDates}
            noteDates={noteDates}
          />
        </div>

        {/* RIGHT - MEETINGS + NOTES */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "1.5rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <strong>Meetings for {selectedDate}</strong>
              <span>{meetings.length} meetings</span>
            </div>

            {/* Show real meetings */}
            <div style={{ marginTop: "1rem" }}>
              {meetings.length > 0 ? (
                meetings.map((m) => (
                  <div key={m.id} style={{ marginBottom: 10 }}>
                    <MeetingCard meeting={m} />
                  </div>
                ))
              ) : (
                <p style={{ color: "#888" }}>No meetings scheduled.</p>
              )}
            </div>

            {/* NOTES SECTION */}
            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1.2rem",
                borderTop: "1px solid #eee",
              }}
            >
              <h3>📝 Notes for {selectedDate}</h3>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your notes..."
                style={{
                  width: "100%",
                  height: "150px",
                  padding: "1rem",
                  borderRadius: 12,
                  border: "1px solid #ccc",
                  resize: "none",
                }}
              />

              <button
                onClick={saveNote}
                style={{
                  marginTop: "0.8rem",
                  padding: "0.75rem",
                  width: "100%",
                  borderRadius: 12,
                  background: "linear-gradient(135deg,#6759FF,#A79BFF)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                💾 Save Notes
              </button>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "1.5rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            <strong>Quick Actions</strong>
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
