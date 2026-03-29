import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CalendarView from "../components/CalendarView";
import MeetingCard from "../components/MeetingCard";
import ActionButton from "../components/ActionButton";
import { apiDelete, apiGet, apiPost } from "../api";
import { useDarkMode } from "../context/DarkModeContext";
import "./Dashboard.css";

export default function Dashboard() {
  const nav = useNavigate();
  const { darkMode } = useDarkMode();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [meetings, setMeetings] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [meetingDates, setMeetingDates] = useState([]);
  const [noteDates, setNoteDates] = useState([]);
  
  // Track mounted state to prevent memory leaks
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Check authentication
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      nav("/login");
    }
  }, [nav]);

  const handleDeleteMeeting = useCallback((deletedId) => {
    setMeetings(prev => prev.filter(m => m.id !== deletedId));
  }, []);

  // Load all data in parallel
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [year, month] = selectedDate.split("-");
        const monthStr = `${year}-${month}`;
        
        const [meetingsRes, monthMeetingsRes, monthNotesRes, notesRes] = await Promise.all([
          apiGet(`/meetings?date=${selectedDate}`),
          apiGet(`/meetings/month?month=${monthStr}`),
          apiGet(`/notes/month?month=${monthStr}`),
          apiGet(`/notes/by-date?date=${selectedDate}`)
        ]);
        
        if (!isMountedRef.current) return;
        
        setMeetings(meetingsRes.meetings || []);
        setMeetingDates(monthMeetingsRes.dates || []);
        setNoteDates(monthNotesRes.dates || []);
        
        const notes = notesRes.notes || [];
        setNoteText(notes.length > 0 ? notes[0].note_text : "");
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        if (!isMountedRef.current) return;
        setMeetings([]);
        setMeetingDates([]);
        setNoteDates([]);
        setNoteText("");
      }
    };
    
    loadAllData();
  }, [selectedDate]);

  const saveNote = useCallback(async () => {
    try {
      await apiPost("/notes/create", {
        note_date: selectedDate,
        note_text: noteText,
      });
      
      alert("Notes saved!");
      
      const [year, month] = selectedDate.split("-");
      const monthStr = `${year}-${month}`;
      const monthNotes = await apiGet(`/notes/month?month=${monthStr}`);
      
      if (isMountedRef.current) {
        setNoteDates(monthNotes.dates || []);
      }
    } catch (err) {
      console.error("Note save failed", err);
      alert("Error saving note");
    }
  }, [selectedDate, noteText]);

  const deleteNoteForSelectedDate = useCallback(async () => {
    const confirmed = window.confirm(`Delete notes for ${selectedDate}?`);
    if (!confirmed) return;
    
    try {
      await apiDelete(`/notes/delete-by-date?date=${selectedDate}`);
      setNoteText("");
      alert("Notes deleted!");
      
      const [year, month] = selectedDate.split("-");
      const monthStr = `${year}-${month}`;
      const monthNotes = await apiGet(`/notes/month?month=${monthStr}`);
      
      if (isMountedRef.current) {
        setNoteDates(monthNotes.dates || []);
      }
    } catch (err) {
      console.error("Note delete failed", err);
      alert("Error deleting note");
    }
  }, [selectedDate]);

  return (
    <div className={`dashboard-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="dashboard-grid">
        {/* LEFT - CALENDAR */}
        <div className="dashboard-card calendar-card">
          <h2>Calendar</h2>
          <CalendarView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            meetingDates={meetingDates}
            noteDates={noteDates}
          />
        </div>

        {/* RIGHT - MEETINGS + NOTES */}
        <div className="dashboard-right">
          <div className="dashboard-card meetings-card">
            <div className="meetings-header">
              <strong>Meetings for {selectedDate}</strong>
              <span className="meeting-count">{meetings.length} meetings</span>
            </div>
            
            <div className="meetings-list">
              {meetings.length > 0 ? (
                meetings.map((m) => (
                  <MeetingCard key={m.id} meeting={m} onDelete={handleDeleteMeeting} />
                ))
              ) : (
                <p className="empty-state">No meetings scheduled.</p>
              )}
            </div>
            
            {/* NOTES SECTION */}
            <div className="notes-section">
              <h3>📝 Notes for {selectedDate}</h3>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your notes..."
                className="notes-textarea"
              />
              <div className="notes-actions">
                <button onClick={saveNote} className="btn-save">
                  Save Notes
                </button>
                <button onClick={deleteNoteForSelectedDate} className="btn-delete">
                  Delete Notes
                </button>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="dashboard-card actions-card">
            <strong>Quick Actions</strong>
            <div className="actions-buttons">
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