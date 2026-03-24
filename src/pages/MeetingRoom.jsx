import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";
import {
  FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash,
  FaStopCircle, FaCircle, FaUsers, FaRobot,
  FaStickyNote, FaComment, FaTimes, FaUser,
  FaChevronRight, FaThumbtack
} from "react-icons/fa";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";

export default function MeetingRoom() {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const { roomId } = useParams();

  const localVideoRef = useRef(null);
  const rawVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingStreamRef = useRef(null);

  const [guestName, setGuestName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(() => localStorage.getItem("isMicOn") !== "false");
  const [isCameraOn, setIsCameraOn] = useState(() => localStorage.getItem("isCameraOn") !== "false");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const [participants, setParticipants] = useState([]);
  const [waitingRoomUsers, setWaitingRoomUsers] = useState([]);
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [waitingRoomStatus, setWaitingRoomStatus] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const peersRef = useRef({});
  const socketRef = useRef(null);
  const localClientIdRef = useRef(`client-${roomId || "unknown"}-${Math.random().toString(36).substr(2, 9)}`);

  const isMicOnRef = useRef(isMicOn);
  const isSpeakingRef = useRef(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [rightPanel, setRightPanel] = useState("ai");
  const [chatMessages, setChatMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [notes, setNotes] = useState("");
  const [aiSummary, setAiSummary] = useState("AI summary will appear here as the meeting progresses...");
  const [actionItems, setActionItems] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const token = localStorage.getItem("token");
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    if (!roomId) {
      navigate("/dashboard");
    }
  }, [roomId]);

  // Initialize participants when joined
  useEffect(() => {
    if (isJoined) {
      setParticipants([{
        id: "you",
        name: guestName || storedUser?.name || "You",
        isMuted: false,
        isVideoOn: true,
        isSpeaking: false,
        isLocal: true
      }]);
    }
  }, [isJoined, guestName, storedUser]);

  // Auto-join for logged-in users
  useEffect(() => {
    if (token && storedUser?.name) {
      setGuestName(storedUser.name);
    }
  }, [token, storedUser]);

  const handleJoin = () => {
    if (guestName.trim()) {
      const userData = {
        id: roomId,
        name: guestName.trim(),
        timestamp: Date.now()
      };
      localStorage.setItem("guestName", guestName);
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'waiting-room-request',
          user: userData
        }));
      }
      setIsInWaitingRoom(true);
    }
  };

  const handleWaitingRoomResponse = (data) => {
    const { approved, reason } = data;
    if (approved) {
      setIsInWaitingRoom(false);
      setIsJoined(true);
    } else {
      setWaitingRoomStatus({ rejected: true, reason: reason || "Entry denied by host" });
    }
  };

  const approveUser = (userName) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'waiting-room-response',
        from: guestName || storedUser?.name,
        to: userName,
        approved: true
      }));
    }
    setWaitingRoomUsers(prev => prev.filter(u => u.name !== userName));
  };

  const rejectUser = (userName) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'waiting-room-response',
        from: guestName || storedUser?.name,
        to: userName,
        approved: false,
        reason: "Entry denied by host"
      }));
    }
    setWaitingRoomUsers(prev => prev.filter(u => u.name !== userName));
  };

  // Colors
  const bgColor = darkMode ? "#0f0f23" : "#F8F9FF";
  const cardBg = darkMode ? "#1a1a2e" : "#ffffff";
  const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";
  const mutedColor = darkMode ? "#888" : "#666";
  const accentColor = "#6759FF";
  const borderColor = darkMode ? "#2a2a3e" : "#e8e8f0";

  const getCtrlBtnStyle = (active, activeColor) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "10px 16px",
    borderRadius: 12,
    border: active ? "none" : `1px solid ${borderColor}`,
    background: active ? activeColor : (darkMode ? "#252540" : "#ffffff"),
    color: active ? "#fff" : textColor,
    cursor: "pointer",
    fontSize: "0.75rem",
    fontWeight: 600,
    minWidth: 70,
    transition: "all 0.2s ease",
  });

  // Render logic
  if (!isJoined) {
    const isLoggedIn = !!token;

    if (isInWaitingRoom && !waitingRoomStatus) {
      return (
        <div style={{ minHeight: "100vh", background: bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 40, maxWidth: 420, width: "90%", textAlign: "center" }}>
            <h2 style={{ color: textColor }}>Waiting Room</h2>
            <p style={{ color: mutedColor }}>Please wait while the host reviews your request...</p>
            <div style={{ color: textColor }}>Name: {guestName}</div>
            <button onClick={() => { setIsInWaitingRoom(false); setGuestName(""); }}>Cancel</button>
          </div>
        </div>
      );
    }

    if (waitingRoomStatus?.rejected) {
      return (
        <div style={{ minHeight: "100vh", background: bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 40, maxWidth: 420, width: "90%", textAlign: "center" }}>
            <h2 style={{ color: textColor }}>Entry Denied</h2>
            <p style={{ color: mutedColor }}>{waitingRoomStatus.reason}</p>
            <button onClick={() => { setWaitingRoomStatus(null); navigate("/dashboard"); }}>Return to Dashboard</button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ minHeight: "100vh", background: bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: cardBg, borderRadius: 20, padding: 40, maxWidth: 420, width: "90%", textAlign: "center" }}>
   <h2 style={{ color: textColor, marginBottom: 8 }}>Join Meeting</h2>
          <p style={{ color: mutedColor, marginBottom: 24 }}>
            {isLoggedIn
              ? `Welcome back, ${storedUser?.name || "User"}! Click below to join.`
              : "Enter your name to join the meeting"}
          </p>

          {!isLoggedIn && (
            <input
              type="text"
              placeholder="Enter your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleJoin()}
              style={{
                width: "100%",
                padding: "14px 16px",
                border: `1px solid ${borderColor}`,
                borderRadius: 12,
                background: darkMode ? "#252540" : "#fff",
                color: textColor,
                fontSize: "1rem",
                marginBottom: 16,
              }}
            />
          )}

          <button
            onClick={handleJoin}
            disabled={!isLoggedIn && !guestName.trim()}
            style={{
              width: "100%",
              padding: "14px",
              background:
                isLoggedIn || guestName.trim()
                  ? "linear-gradient(135deg, #6759FF, #8B7FFF)"
                  : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: "1rem",
              fontWeight: 600,
              cursor: isLoggedIn || guestName.trim() ? "pointer" : "not-allowed",
            }}
          >
            Join Meeting
          </button>
        </div>
      </div>
    );
  }

  // MAIN MEETING ROOM UI
  return (
    <div
      style={{
        minHeight: "100vh",
        background: bgColor,
        paddingTop: 60,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <video ref={rawVideoRef} style={{ display: "none" }} autoPlay muted playsInline />

      {/* HEADER */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: cardBg,
          borderBottom: `1px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6759FF, #8B7FFF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            M
          </div>
          <div style={{ fontWeight: 600, color: textColor }}>Meetify Meeting</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {waitingRoomUsers.length > 0 && (
            <button
              onClick={() => setRightPanel("waiting-room")}
              style={{
                padding: "8px 14px",
                background: "linear-gradient(135deg, #FFA500, #FF6B35)",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              <FaUser /> {waitingRoomUsers.length} in Waiting Room
            </button>
          )}

          <button
            onClick={() => setRightPanel("participants")}
            style={{
              padding: "8px 14px",
              background: "linear-gradient(135deg, #6759FF, #8B7FFF)",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            <FaUsers /> {participants.length}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              background: darkMode ? "#252540" : "#f5f5ff",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6759FF, #8B7FFF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              {(guestName || "?").charAt(0).toUpperCase()}
            </div>
            <span style={{ color: textColor }}>{guestName}</span>
          </div>
        </div>
      </header>

      {/* VIDEO GRID, RIGHT PANEL, CONTROLS BAR */}
      {/* Keep your existing video grid, right panel (AI, chat, notes, participants, waiting room), and controls bar code here */}
    </div>
  );
}