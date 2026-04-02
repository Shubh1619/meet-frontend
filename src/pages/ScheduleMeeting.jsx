import React, { useState, useEffect } from "react";
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
import { useLocation, useNavigate } from "react-router-dom";
import ActionButton from "../components/ActionButton";
import { apiPost } from "../api";
import { useToast } from "../components/ToastProvider";

const theme = createTheme({
  palette: {
    primary: { main: "#6759FF" },
    background: { default: "#F8F9FF", paper: "#FFFFFF" },
    text: { primary: "#1E1E2F", secondary: "#606074" },
  },
  shape: { borderRadius: 10 },
});

export default function ScheduleMeeting() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const preselectedDate = location.state?.selectedDate;
  const initialDate = preselectedDate && dayjs(preselectedDate).isValid()
    ? dayjs(preselectedDate)
    : dayjs();

  // Auth check
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
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

  const [topic, setTopic] = useState("");
  const [agenda, setAgenda] = useState("");
  const [participants, setParticipants] = useState("");

  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(dayjs());
  const [endTime, setEndTime] = useState(dayjs().add(1, "hour"));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Combine date and time into a single dayjs object
    // Use local timezone (no UTC conversion)
    const combineDateTime = (dateVal, timeVal) => {
      const combined = dayjs(dateVal.format("YYYY-MM-DD")).hour(timeVal.hour()).minute(timeVal.minute()).second(0);
      return combined.format("YYYY-MM-DDTHH:mm:ss");
    };

    const payload = {
      title: topic,
      agenda,
      start_time: combineDateTime(date, startTime),
      end_time: combineDateTime(date, endTime),
      participants: participants
        ? participants.split(",").map((p) => p.trim()).filter(Boolean)
        : [],
    };

    // Debug logging
    console.log("📅 Date selected:", date.format("YYYY-MM-DD"));
    console.log("📅 Start time:", startTime.format("HH:mm"));
    console.log("📅 Combined start:", payload.start_time);
    console.log("📅 System timezone offset:", new Date().getTimezoneOffset());
    console.log("📅 Sending payload:", payload);

    try {
      const res = await apiPost("/schedule", payload);
      toast.success("Meeting scheduled successfully.");
      console.log("📅 Backend response:", res);
      navigate("/dashboard");
    } catch (err) {
      toast.error("Failed to schedule meeting.");
      console.error(err);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="schedule-page"
        sx={{
          minHeight: "100vh",
          backgroundColor: "background.default",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingTop: "5.75rem",
          px: 2,
          pb: 3,
        }}
      >
        <Box
          sx={{
            backgroundColor: "background.paper",
            borderRadius: 3,
            p: { xs: 2, sm: 4 },
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            width: "100%",
            maxWidth: 720,
          }}
        >
          {/* Logo */}
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
            </Box>
            <Box sx={{ fontSize: 20, fontWeight: 600, color: "primary.main" }}>
              Meeting Platform
            </Box>
          </Box>

          <h2 style={{ textAlign: "center", color: "#1E1E2F", marginBottom: "1rem" }}>
            Schedule a Meeting 📅
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Topic */}
            <label className="small-muted required-label">Topic</label>
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
            <label className="small-muted required-label">Agenda</label>
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

            {/* Date & Time */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box
                sx={{
                  display: "flex",
                gap: 2,
                flexWrap: "wrap",
                mt: 2,
                mb: 2,
                "& > *": {
                  flex: "1 1 180px",
                },
              }}
            >
                <DatePicker
                  label="Select Date"
                  value={date}
                  onChange={(v) => setDate(v)}
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
                <TimePicker
                  label="Start Time"
                  value={startTime}
                  onChange={(v) => setStartTime(v)}
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
                <TimePicker
                  label="End Time"
                  value={endTime}
                  onChange={(v) => setEndTime(v)}
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
              </Box>
            </LocalizationProvider>

            {/* Participants (optional) */}
            <label className="small-muted">
              Participants <span style={{ color: "#999" }}>(optional)</span>
            </label>
            <TextField
              fullWidth
              size="small"
              margin="dense"
              placeholder="emails separated by commas"
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

