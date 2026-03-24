import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";
import {
  FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash,
  FaDesktop, FaStopCircle, FaCircle, FaUsers, FaRobot,
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

  // ... (keep your existing camera init, signaling, peer connection, screen share, recording, chat, AI summary, notes, participants, controls bar, and UI code — just with all PIN-related logic removed)

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

  return (
    <div style={{ minHeight: "100vh", background: bgColor }}>
      {/* Your full meeting UI goes here, with PIN modal and PIN button removed */}
    </div>
  );
}
