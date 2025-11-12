import React, { useState } from "react";
import CalendarView from "../components/CalendarView";
import MeetingCard from "../components/MeetingCard";
import ActionButton from "../components/ActionButton";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const meetings = [
    { id: 1, title: "Project Kickoff", time: "12/11/2025 16:00", location: "Online" },
    { id: 2, title: "Design Review", time: "13/11/2025 10:00", location: "In Office" },
    { id: 3, title: "Client Demo", time: "15/11/2025 14:30", location: "Zoom" },
  ];

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
        {/* 🗓 Calendar */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            padding: "1.5rem",
          }}
        >
          <h2 style={{ marginBottom: "1rem", color: "#1E1E2F" }}>Calendar</h2>
          <CalendarView selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>

        {/* 📋 Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* 🕑 Meeting List */}
          <div
            className="card"
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
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 600, color: "#1E1E2F" }}>
                Meetings for {selectedDate.toLocaleDateString()}
              </div>
              <div style={{ color: "#606074", fontSize: "0.9rem" }}>
                {meetings.length} meetings
              </div>
            </div>

            <div className="mt-2" style={{ marginTop: "1rem" }}>
              {meetings.map((m) => (
                <div key={m.id} style={{ marginBottom: 10 }}>
                  <MeetingCard meeting={m} />
                </div>
              ))}
            </div>
          </div>

          {/* ⚡ Quick Actions */}
          <div
            className="card"
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "1.5rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontWeight: 600, color: "#1E1E2F" }}>Quick Actions</div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <ActionButton onClick={() => (window.location.href = "/instant")}>
                Instant Meeting
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => (window.location.href = "/schedule")}>
                Schedule Meeting
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
