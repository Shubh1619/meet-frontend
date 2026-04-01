import React, { useMemo, useState, useEffect } from "react";
import { useDarkMode } from "../context/DarkModeContext";

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export default function CalendarView({
  selectedDate,
  onSelectDate,
  meetingDates = [],
  noteDates = [],
}) {
  const { darkMode } = useDarkMode();
  const initialDate = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );

  // Sync visible month only when selected date changes from outside.
  useEffect(() => {
    if (!selectedDate) return;
    const selected = new Date(`${selectedDate}T00:00:00`);
    const selectedMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);

    setCurrentMonth((prev) => {
      if (
        prev.getFullYear() === selectedMonth.getFullYear() &&
        prev.getMonth() === selectedMonth.getMonth()
      ) {
        return prev;
      }
      return selectedMonth;
    });
  }, [selectedDate]);

  const prevMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(next);
  };

  const nextMonth = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(next);
  };

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startWeekday = firstDayOfMonth.getDay();

    // Fixed 6x7 grid like standard calendars.
    const gridStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1 - startWeekday);

    return Array.from({ length: 42 }, (_, idx) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + idx);
      return {
        date,
        inCurrentMonth: date.getMonth() === currentMonth.getMonth(),
      };
    });
  }, [currentMonth]);

  const dayBg = darkMode ? "#0f0f23" : "#F8F9FF";
  const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";
  const mutedColor = darkMode ? "#666" : "#606074";

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1rem",
          alignItems: "center",
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
          {"<"}
        </button>

        <div style={{ fontWeight: 600, color: textColor }}>
          {currentMonth.toLocaleString("default", { month: "long" })} {currentMonth.getFullYear()}
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
          {">"}
        </button>
      </div>

      <div
        className="calendar-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          textAlign: "center",
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={{ fontWeight: 600, color: mutedColor }}>
            {d}
          </div>
        ))}

        {calendarCells.map(({ date, inCurrentMonth }) => {
          const formatted = formatDate(date);
          const hasMeeting = meetingDates.includes(formatted);
          const hasNote = noteDates.includes(formatted);
          const isSelected = selectedDate && isSameDay(date, new Date(`${selectedDate}T00:00:00`));

          return (
            <div
              key={formatted}
              onClick={() => onSelectDate(formatted)}
              className="calendar-day-cell"
              style={{
                borderRadius: "8px",
                cursor: "pointer",
                background: isSelected ? "linear-gradient(135deg, #6759FF, #A79BFF)" : dayBg,
                color: isSelected ? "#fff" : inCurrentMonth ? textColor : mutedColor,
                opacity: inCurrentMonth ? 1 : 0.65,
                transition: "0.2s",
              }}
            >
              {date.getDate()}

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
                      background: isSelected ? "#ffffff" : "#6759FF",
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
