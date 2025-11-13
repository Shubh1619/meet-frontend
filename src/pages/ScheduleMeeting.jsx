import React, { useState } from "react";
import {
  TextField,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import ActionButton from "../components/ActionButton";

// 💜 Meetify Theme
const theme = createTheme({
  palette: {
    primary: { main: "#6759FF" },
    background: { default: "#F8F9FF", paper: "#FFFFFF" },
    text: { primary: "#1E1E2F", secondary: "#606074" },
  },
  shape: { borderRadius: 10 },
});

export default function ScheduleMeeting() {
  const [topic, setTopic] = useState("");
  const [agenda, setAgenda] = useState("");
  const [participants, setParticipants] = useState("");
  const [date, setDate] = useState(dayjs());
  const [startTime, setStartTime] = useState(dayjs());
  const [endTime, setEndTime] = useState(dayjs().add(1, "hour"));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      topic,
      agenda,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      participants: participants
        ? participants.split(",").map((p) => p.trim()).filter(Boolean)
        : [],
    };

    console.log("📅 Meeting Scheduled:", payload);
    alert("✅ Meeting scheduled successfully!");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "background.default",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: "4rem",
        }}
      >
        <Box
          sx={{
            backgroundColor: "background.paper",
            borderRadius: 3,
            p: 4,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            width: "100%",
            maxWidth: 720,
          }}
        >
          {/* 💜 Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                background:
                  "linear-gradient(135deg, #6759FF, #A79BFF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              M
            </Box>
            <Box
              sx={{
                fontSize: 20,
                fontWeight: 600,
                color: "primary.main",
              }}
            >
              Meetify
            </Box>
          </Box>

          <h2
            style={{
              textAlign: "center",
              color: "#1E1E2F",
              marginBottom: "1rem",
            }}
          >
            Schedule a Meeting 📅
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Topic */}
            <label className="small-muted">Topic</label>
            <TextField
              fullWidth
              size="small"
              margin="dense"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Project Kickoff"
              required
            />

            {/* Agenda */}
            <label className="small-muted">Agenda</label>
            <TextField
              fullWidth
              size="small"
              margin="dense"
              multiline
              minRows={3}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Discuss project roadmap, milestones, and design overview."
              required
            />

            {/* Date + Time */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  mt: 2,
                  mb: 2,
                }}
              >
                <DatePicker
                  label="Select Date"
                  value={date}
                  onChange={(newValue) => setDate(newValue)}
                  slotProps={{
                    textField: { fullWidth: true, size: "small" },
                  }}
                />
                <TimePicker
                  label="Start Time"
                  value={startTime}
                  onChange={(newValue) => setStartTime(newValue)}
                  slotProps={{
                    textField: { fullWidth: true, size: "small" },
                  }}
                />
                <TimePicker
                  label="End Time"
                  value={endTime}
                  onChange={(newValue) => setEndTime(newValue)}
                  slotProps={{
                    textField: { fullWidth: true, size: "small" },
                  }}
                />
              </Box>
            </LocalizationProvider>

            {/* Participants */}
            <label className="small-muted">
              Participants <span style={{ color: "#999" }}>(optional)</span>
            </label>
            <TextField
              fullWidth
              size="small"
              margin="dense"
              placeholder="Enter emails separated by commas"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
            />

            <ActionButton
              type="submit"
              style={{
                width: "100%",
                padding: "0.9rem",
                fontSize: "1rem",
                borderRadius: "10px",
                marginTop: "1.5rem",
              }}
            >
              Schedule Meeting
            </ActionButton>
          </form>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
