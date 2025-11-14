import React, { useState } from "react";

export default function CalendarView({
  selectedDate,
  onSelectDate,
  meetingDates = [],
  noteDates = []
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const monthEnd = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );
  const daysInMonth = monthEnd.getDate();

  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );

  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const days = [...Array(daysInMonth).keys()].map(
    (d) =>
      new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d + 1)
  );

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.2rem",
            cursor: "pointer",
            color: "#6759FF",
          }}
        >
          ‹
        </button>

        <div style={{ fontWeight: 600 }}>
          {currentMonth.toLocaleString("default", { month: "long" })}{" "}
          {currentMonth.getFullYear()}
        </div>

        <button
          onClick={nextMonth}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.2rem",
            cursor: "pointer",
            color: "#6759FF",
          }}
        >
          ›
        </button>
      </div>

      {/* Days Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "0.5rem",
          textAlign: "center",
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={{ fontWeight: 600, color: "#606074" }}>
            {d}
          </div>
        ))}

        {days.map((day) => {
          const formatted = formatDate(day);

          const hasMeeting = meetingDates.includes(formatted);
          const hasNote = noteDates.includes(formatted);

          return (
            <div
              key={formatted}
              onClick={() => onSelectDate(formatted)}
              style={{
                padding: "0.8rem 0",
                borderRadius: "8px",
                cursor: "pointer",
                background:
                  selectedDate && isSameDay(day, new Date(selectedDate))
                    ? "linear-gradient(135deg, #6759FF, #A79BFF)"
                    : "#F8F9FF",
                color:
                  selectedDate && isSameDay(day, new Date(selectedDate))
                    ? "#fff"
                    : "#1E1E2F",
                transition: "0.2s",
              }}
            >
              {day.getDate()}

              {/* Indicators */}
              <div
                style={{
                  marginTop: "4px",
                  display: "flex",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                {hasMeeting && (
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#6759FF",
                    }}
                  />
                )}

                {hasNote && (
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#F7C948",
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
