import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CalendarView from "../components/CalendarView.jsx";
import MeetingCard from "../components/MeetingCard";
import ActionButton from "../components/ActionButton";
import NotesModal from "../components/NotesModal";
import { apiDelete, apiGet, apiPost, apiPut } from "../api";
import { useDarkMode } from "../context/DarkModeContext";
import { useToast } from "../components/ToastProvider";
import "./Dashboard.css";

function isMeaningfulNote(value) {
  const text = (value || "").trim();
  return text.length > 0 && !/^[.\s]+$/.test(text);
}

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Dashboard() {
  const nav = useNavigate();
  const { darkMode } = useDarkMode();
  const today = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [meetings, setMeetings] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [notesForDate, setNotesForDate] = useState([]);
  const [meetingDates, setMeetingDates] = useState([]);
  const [noteDates, setNoteDates] = useState([]);
  const [noteError, setNoteError] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const toast = useToast();

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      nav("/login");
    }
  }, [nav]);

  const handleDeleteMeeting = useCallback((deletedId) => {
    setMeetings((prev) => prev.filter((m) => m.id !== deletedId));
  }, []);

  const refreshMonthNoteDates = useCallback(async (dateStr) => {
    const [year, month] = dateStr.split("-");
    const monthStr = `${year}-${month}`;
    const monthNotes = await apiGet(`/notes/month?month=${monthStr}`);
    if (isMountedRef.current) {
      setNoteDates(monthNotes.dates || []);
    }
  }, []);

  const refreshNotesForDate = useCallback(async (dateStr) => {
    const notesRes = await apiGet(`/notes/by-date?date=${dateStr}`);
    if (isMountedRef.current) {
      setNotesForDate(notesRes.notes || []);
    }
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [year, month] = selectedDate.split("-");
        const monthStr = `${year}-${month}`;

        const [dashboardMeetingsRes, monthNotesRes, notesRes] = await Promise.all([
          apiGet("/meetings/dashboard"),
          apiGet(`/notes/month?month=${monthStr}`),
          apiGet(`/notes/by-date?date=${selectedDate}`),
        ]);

        if (!isMountedRef.current) return;

        const groupedMeetings = dashboardMeetingsRes || {};
        setMeetings(groupedMeetings[selectedDate] || []);
        setMeetingDates(Object.keys(groupedMeetings));
        setNoteDates(monthNotesRes.dates || []);
        setNotesForDate(notesRes.notes || []);
        setNoteText("");
        setNoteError("");
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        if (!isMountedRef.current) return;
        setMeetings([]);
        setMeetingDates([]);
        setNoteDates([]);
        setNotesForDate([]);
        setNoteText("");
        setNoteError("");
      }
    };

    loadAllData();
  }, [selectedDate]);

  const isNoteValid = useMemo(() => isMeaningfulNote(noteText), [noteText]);

  const saveNote = useCallback(async () => {
    if (!isMeaningfulNote(noteText)) {
      setNoteError("Note cannot be empty or meaningless");
      return;
    }

    setIsSavingNote(true);
    setNoteError("");
    try {
      await apiPost("/notes/create", {
        note_date: selectedDate,
        note_text: noteText.trim(),
      });

      await Promise.all([refreshNotesForDate(selectedDate), refreshMonthNoteDates(selectedDate)]);
      if (isMountedRef.current) {
        setNoteText("");
      }
    } catch (err) {
      console.error("Note save failed", err);
      if (isMountedRef.current) {
        setNoteError("Error saving note");
      }
    } finally {
      if (isMountedRef.current) {
        setIsSavingNote(false);
      }
    }
  }, [noteText, selectedDate, refreshNotesForDate, refreshMonthNoteDates]);

  const handleUpdateNote = useCallback(
    async (noteId, updatedText) => {
      if (!isMeaningfulNote(updatedText)) {
        throw new Error("Note cannot be empty or meaningless");
      }

      await apiPut(`/notes/${noteId}`, {
        note_text: updatedText.trim(),
      });

      if (!isMountedRef.current) return;
      setNotesForDate((prev) =>
        prev.map((note) =>
          note.id === noteId
            ? {
                ...note,
                note_text: updatedText.trim(),
                content: updatedText.trim(),
              }
            : note,
        ),
      );
    },
    [],
  );

  const handleDeleteSingleNote = useCallback(
    async (noteId) => {
      try {
        await apiDelete(`/notes/${noteId}`);
        if (!isMountedRef.current) return;
        setNotesForDate((prev) => prev.filter((note) => note.id !== noteId));
        await refreshMonthNoteDates(selectedDate);
      } catch (err) {
        console.error("Failed to delete note", err);
        toast.error("Unable to delete note.");
      }
    },
    [selectedDate, refreshMonthNoteDates, toast],
  );

  return (
    <div className={`dashboard-container ${darkMode ? "dark" : "light"}`}>
      <div className="dashboard-grid">
        <div className="dashboard-card calendar-card">
          <h2>Calendar</h2>
          <CalendarView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            meetingDates={meetingDates}
            noteDates={noteDates}
          />
        </div>

        <div className="dashboard-right">
          <div className="dashboard-card meetings-card">
            <div className="meetings-header">
              <strong>Meetings for {selectedDate}</strong>
              <span className="meeting-count">{meetings.length} meetings</span>
            </div>

            <div className={`meetings-list ${meetings.length === 0 ? "is-empty" : ""}`}>
              {meetings.length > 0 ? (
                meetings.map((m) => <MeetingCard key={m.id} meeting={m} onDelete={handleDeleteMeeting} />)
              ) : (
                <p className="empty-state">No meetings scheduled.</p>
              )}
            </div>

            <div className="notes-section">
              <h3>Notes for {selectedDate}</h3>
              <textarea
                value={noteText}
                onChange={(e) => {
                  setNoteText(e.target.value);
                  if (noteError) setNoteError("");
                }}
                placeholder="Write your note..."
                className={`notes-textarea ${noteError ? "has-error" : ""}`}
              />
              {noteError && <p className="notes-error">{noteError}</p>}
              <div className="notes-actions">
                <button onClick={saveNote} className="btn-save" disabled={!isNoteValid || isSavingNote}>
                  {isSavingNote ? "Saving..." : "Save Note"}
                </button>
                <button onClick={() => setIsNotesModalOpen(true)} className="btn-view-notes">
                  View Notes
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard-card actions-card">
            <strong>Quick Actions</strong>
            <div className="actions-buttons">
              <ActionButton onClick={() => (window.location.href = "/instant")}>Instant Meeting</ActionButton>
              <ActionButton
                variant="ghost"
                onClick={() => nav("/schedule", { state: { selectedDate } })}
              >
                Schedule Meeting
              </ActionButton>
            </div>
          </div>
        </div>
      </div>

      <NotesModal
        open={isNotesModalOpen}
        selectedDate={selectedDate}
        notes={notesForDate}
        onClose={() => setIsNotesModalOpen(false)}
        onSaveNote={handleUpdateNote}
        onDeleteNote={handleDeleteSingleNote}
      />
    </div>
  );
}
