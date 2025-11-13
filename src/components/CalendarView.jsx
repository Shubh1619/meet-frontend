import React, { useState } from "react";

export default function CalendarView({ selectedDate, onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();

  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );

  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );

  // Convert date to YYYY-MM-DD (safe for backend)
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const days = [...Array(daysInMonth).keys()].map(
    (d) => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d + 1)
  );

  const isSameDay = (d1, d2) => {
    if (!d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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

        <div style={{ fontWeight: 600, color: "#1E1E2F" }}>
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
          <div
            key={d}
            style={{
              fontWeight: 600,
              color: "#606074",
              fontSize: "0.85rem",
            }}
          >
            {d}
          </div>
        ))}

        {days.map((day) => (
          <div
            key={day.toISOString()}
            onClick={() => {
              const formatted = formatDate(day); // 👉 always safe date string
              onSelectDate(formatted);
            }}
            style={{
              padding: "0.8rem 0",
              borderRadius: "8px",
              cursor: "pointer",
              background:
                selectedDate &&
                isSameDay(day, new Date(selectedDate))
                  ? "linear-gradient(135deg, #6759FF, #A79BFF)"
                  : "#F8F9FF",
              color:
                selectedDate &&
                isSameDay(day, new Date(selectedDate))
                  ? "#fff"
                  : "#1E1E2F",
              transition: "all 0.2s ease",
            }}
          >
            {day.getDate()}
          </div>
        ))}
      </div>
    </div>
  );
}
