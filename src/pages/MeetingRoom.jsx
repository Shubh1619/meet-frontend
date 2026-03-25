import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaDoorOpen, FaLock, FaUsers, FaHourglassHalf } from "react-icons/fa";
import ControlsBar from "./ControlsBar";
import ChatSidebar from "./ChatSidebar";
import RecordingModal from "./RecordingModal";
import VideoTile from "./VideoTile";
import "./MeetingRoom.css";

export default function MeetingRoom() {
  // --- State ---
  const { roomId } = useParams();
  const navigate = useNavigate();
  const initialStoredUser = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const [setupVisible, setSetupVisible] = useState(true);
  const [roomVisible, setRoomVisible] = useState(false);
  const [roomName, setRoomName] = useState("Room Name");
  const [profileUser, setProfileUser] = useState(initialStoredUser);
  const [profileReady, setProfileReady] = useState(!isLoggedIn);
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [meetingReady, setMeetingReady] = useState(false);
  const [meetingLoadError, setMeetingLoadError] = useState("");
  const [hostSessionId, setHostSessionId] = useState("");
  const [guestSessionId, setGuestSessionId] = useState("");
  const [isHostUser, setIsHostUser] = useState(false);
  const [hostAccessResolved, setHostAccessResolved] = useState(!isLoggedIn);
  const [myName, setMyName] = useState(initialStoredUser?.name || "Guest");
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [waitMessage, setWaitMessage] = useState("");
  const [participants, setParticipants] = useState([]);
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");

  const [recordingModalOpen, setRecordingModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState("00:00");

  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [captions, setCaptions] = useState({});
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);

  // --- Media/WebRTC ---
  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const pcsRef = useRef({});
  const wsRef = useRef(null);
  const myId = useRef(null);
  const hasJoinedRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const reconnectFnRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    const sessionKey = `meeting-client-id:${roomId}`;
    const storedClientId = sessionStorage.getItem(sessionKey);

    if (storedClientId) {
      myId.current = storedClientId;
    } else {
      myId.current = Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem(sessionKey, myId.current);
    }
  }, [roomId]);

  useEffect(() => {
    const nav = document.querySelector("nav");
    if (isLoggedIn && nav) {
      nav.style.display = "none";
      return () => {
        nav.style.display = "";
      };
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setProfileReady(true);
      return;
    }

    let ignore = false;

    async function syncProfile() {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unable to refresh profile");
        }

        const data = await response.json();
        if (ignore) return;

        setProfileUser(data);
        setMyName(data?.name || initialStoredUser?.name || "Host");
        localStorage.setItem("user", JSON.stringify(data));
      } catch (error) {
        if (!ignore) {
          console.error("Failed to refresh meeting profile:", error);
          setMyName(initialStoredUser?.name || "Host");
        }
      } finally {
        if (!ignore) {
          setProfileReady(true);
        }
      }
    }

    syncProfile();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, initialStoredUser?.name]);

  useEffect(() => {
    let ignore = false;

    async function loadMeetingAccess() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/meeting/${roomId}`);
        if (!response.ok) {
          throw new Error("Unable to load meeting info");
        }

        const data = await response.json();
        if (ignore) return;

        setMeetingInfo(data);
        setRoomName(data?.title || data?.room_id || roomId || "Meeting Room");
        setMeetingLoadError("");
      } catch (error) {
        if (!ignore) {
          console.error("Failed to load meeting info:", error);
          setRoomName(roomId || "Meeting Room");
          setMeetingLoadError("Meeting not found or unavailable.");
        }
      } finally {
        if (!ignore) {
          setMeetingReady(true);
        }
      }
    }

    if (roomId) {
      loadMeetingAccess();
    }

    return () => {
      ignore = true;
    };
  }, [roomId]);

  useEffect(() => {
    if (!meetingReady) return;
    if (!isLoggedIn || !profileUser?.id || !meetingInfo?.host?.id) {
      setIsHostUser(false);
      setHostSessionId("");
      setHostAccessResolved(true);
      return;
    }

    let ignore = false;
    const matchesHost = profileUser.id === meetingInfo.host.id;

    setIsHostUser(matchesHost);

    if (!matchesHost) {
      setHostSessionId("");
      setHostAccessResolved(true);
      return;
    }

    setHostAccessResolved(false);

    async function createHostSession() {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/host-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            room_id: roomId,
            token,
          }),
        });

        if (!response.ok) {
          throw new Error("Unable to validate host session");
        }

        const data = await response.json();
        if (!ignore) {
          setHostSessionId(data.session_id || "");
          setHostAccessResolved(true);
        }
      } catch (error) {
        if (!ignore) {
          console.error("Failed to create host session:", error);
          setHostSessionId("");
          setIsHostUser(false);
          setHostAccessResolved(true);
        }
      }
    }

    createHostSession();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, profileUser?.id, meetingInfo?.host?.id, meetingReady, roomId]);

  useEffect(() => {
    if (!roomId) return;

    const storedHostSession = sessionStorage.getItem(`meeting-host-session:${roomId}`);
    if (storedHostSession) {
      setHostSessionId(storedHostSession);
      setIsHostUser(true);
      setHostAccessResolved(true);
    }

    const storedGuestSession = sessionStorage.getItem(`meeting-guest-session:${roomId}`);
    if (storedGuestSession) {
      setGuestSessionId(storedGuestSession);
    }
  }, [roomId]);

  // --- Local Stream Handler ---
  const setLocalStreamHandler = useCallback((stream, displayName = myName) => {
    localStreamRef.current = stream;
    setParticipants((prev) => {
      const exists = prev.find((p) => p.id === "you");
      if (exists) {
        return prev.map((p) => (
          p.id === "you"
            ? { ...p, name: displayName, stream }
            : p
        ));
      } else {
        return [...prev, { id: "you", name: displayName, stream, audioEnabled: true, videoEnabled: true, isLocal: true }];
      }
    });
  }, [myName]);

  function monitorAudioLevel(stream, id) {
    if (!id) return;
    setActiveSpeakerId(id);
  }

  const sendStateUpdate = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "update-state",
        id: myId.current,
        audioEnabled: stream.getAudioTracks()[0]?.enabled ?? false,
        videoEnabled: stream.getVideoTracks()[0]?.enabled ?? false,
      }));
    }
  }, []);

  function toggleMic() {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setParticipants((prev) =>
      prev.map((p) => (p.id === "you" ? { ...p, audioEnabled: track.enabled } : p))
    );
    sendStateUpdate();
  }

  function toggleCamera() {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setParticipants((prev) =>
      prev.map((p) => (p.id === "you" ? { ...p, videoEnabled: track.enabled } : p))
    );
    sendStateUpdate();
  }

  const toggleScreenShare = () => setIsScreenSharing((prev) => !prev);
  const startRecording = () => {
    setIsRecording(true);
    setRecordingTimer("00:00");
  };
  const stopRecording = () => setIsRecording(false);
  const leaveMeeting = (shouldRedirect = true) => {
    hasJoinedRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "leave", id: myId.current }));
    }

    Object.values(pcsRef.current).forEach((pc) => pc.close());
    pcsRef.current = {};

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    localStreamRef.current = null;
    setChatOpen(false);
    setMessages([]);
    setMsgInput("");
    setRoomVisible(false);
    setSetupVisible(true);
    setParticipants([]);
    setPinnedParticipantId(null);
    setIsInWaitingRoom(false);

    if (shouldRedirect) {
      if (isHostUser) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    }
  };
  const sendChatMessage = (message) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "chat-message",
        message: trimmedMessage,
        name: myName || "Guest",
      }));
    }

    setMessages((prev) => [...prev, { from: myName || "Guest", text: trimmedMessage, time: new Date().toLocaleTimeString(), own: true }]);
    setMsgInput("");
  };

  // --- Peer Connection ---
  const shouldInitiateConnection = useCallback((remoteId) => {
    if (!myId.current || !remoteId) return false;
    return myId.current.localeCompare(remoteId) < 0;
  }, []);

  const createPeerConnection = useCallback((remoteId, remoteName, audioEnabled, videoEnabled) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    pcsRef.current[remoteId] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
    }

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      setParticipants((prev) => {
        const exists = prev.find((p) => p.id === remoteId);
        if (exists) {
          return prev.map((p) => (p.id === remoteId ? { ...p, stream, audioEnabled, videoEnabled } : p));
        } else {
          return [...prev, { id: remoteId, name: remoteName, stream, audioEnabled, videoEnabled }];
        }
      });
      monitorAudioLevel(stream, remoteId);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "candidate", candidate: e.candidate, from: myId.current, to: remoteId }));
      }
    };

    return pc;
  }, []);

  // --- WebSocket ---
  const connectWebSocket = useCallback((room, participantName, hostMode, sessionId = "") => {
    const WS_SERVER = import.meta.env.VITE_WS_URL;
    const wsUrl = `${WS_SERVER}/ws/${room}`;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      const joinType = hostMode ? "host-join" : "waiting-room-request";
      socket.send(
        JSON.stringify({
          type: joinType,
          from: myId.current,
          name: participantName,
          session_id: sessionId,
          audioEnabled: localStreamRef.current?.getAudioTracks()[0]?.enabled ?? true,
          videoEnabled: localStreamRef.current?.getVideoTracks()[0]?.enabled ?? true,
        })
      );
    };

    socket.onmessage = async (e) => {
      if (e.data.includes('"type":"ping"')) return;
      const msg = JSON.parse(e.data);
      if (msg.from === myId.current) return;

      let pc = pcsRef.current[msg.from];
      if (!pc && (msg.type === "offer" || msg.type === "join")) {
        pc = createPeerConnection(msg.from, msg.name, msg.audioEnabled, msg.videoEnabled);
      }

      switch (msg.type) {
        case "waiting-user":
          setWaitingUsers((prev) => {
            const existing = prev.find((u) => u.client_id === msg.client_id);
            if (existing) {
              return prev.map((u) => (
                u.client_id === msg.client_id
                  ? { ...u, name: msg.name || u.name }
                  : u
              ));
            }
            return [...prev, { client_id: msg.client_id, name: msg.name || "Guest" }];
          });
          return;

        case "user-joined":
          if (msg.id === myId.current) return;
          setParticipants((prev) => {
            const existing = prev.find((p) => p.id === msg.id);
            if (existing) {
              return prev.map((p) => (
                p.id === msg.id
                  ? {
                      ...p,
                      name: msg.name || p.name,
                      audioEnabled: msg.audioEnabled ?? p.audioEnabled ?? true,
                      videoEnabled: msg.videoEnabled ?? p.videoEnabled ?? true,
                    }
                  : p
              ));
            }

            return [
              ...prev,
              {
                id: msg.id,
                name: msg.name || "Guest",
                isLocal: false,
                audioEnabled: msg.audioEnabled ?? true,
                videoEnabled: msg.videoEnabled ?? true,
              },
            ];
          });

          if (!pcsRef.current[msg.id] && shouldInitiateConnection(msg.id)) {
            const peer = createPeerConnection(msg.id, msg.name, true, true);
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            wsRef.current?.send(JSON.stringify({ ...peer.localDescription.toJSON(), from: myId.current, to: msg.id, name: participantName }));
          }
          return;

        case "waiting":
          setIsInWaitingRoom(true);
          setWaitMessage(msg.message || "Waiting for host approval...");
          return;

        case "approved":
          setIsInWaitingRoom(false);
          setRoomVisible(true);
          setWaitMessage("");
          return;

        case "denied":
          alert(msg.message || "Your entry was denied by the host.");
          setIsInWaitingRoom(false);
          setSetupVisible(true);
          setRoomVisible(false);
          setWaitMessage("");
          return;

        case "update-state":
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === msg.id
                ? { ...p, audioEnabled: msg.audioEnabled, videoEnabled: msg.videoEnabled }
                : p
            )
          );
          return;

        case "join": {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.send(JSON.stringify({ ...pc.localDescription.toJSON(), from: myId.current, to: msg.from, name: participantName }));
          break;
        }
        case "offer": {
          await pc.setRemoteDescription(new RTCSessionDescription(msg));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.send(JSON.stringify({ ...pc.localDescription.toJSON(), from: myId.current, to: msg.from, name: participantName }));
          break;
        }
        case "answer":
          await pc.setRemoteDescription(new RTCSessionDescription(msg));
          break;
        case "candidate":
          if (pc) await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          break;
        case "chat-message":
          setMessages((prev) => [...prev, { from: msg.name, text: msg.message, time: new Date().toLocaleTimeString(), own: false }]);
          break;
        case "waiting-user-left":
          setWaitingUsers((prev) => prev.filter((user) => user.client_id !== msg.client_id));
          break;
        case "removed":
          alert(msg.message || "You were removed from the meeting.");
          leaveMeeting();
          return;
        case "host-left":
          alert(msg.message || "The host has left the meeting.");
          leaveMeeting();
          return;
        case "user-left":
          if (pcsRef.current[msg.id]) {
            pcsRef.current[msg.id].close();
            delete pcsRef.current[msg.id];
          }
          setParticipants((prev) => prev.filter((p) => p.id !== msg.id));
          setPinnedParticipantId((prev) => (prev === msg.id ? null : prev));
          break;
      }
    };

    socket.onclose = () => {
      if (captionsEnabled) setCaptionsEnabled(false);
      if (isRecording) setIsRecording(false);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        if (hasJoinedRef.current && reconnectFnRef.current) {
          reconnectFnRef.current(room, participantName, hostMode, sessionId);
        }
      }, 5000);
    };
  }, [captionsEnabled, isRecording, createPeerConnection, shouldInitiateConnection]);

  useEffect(() => {
    reconnectFnRef.current = connectWebSocket;
  }, [connectWebSocket]);

  const ensureGuestSession = useCallback(async (displayName) => {
    if (!roomId) return "";

    const storageKey = `meeting-guest-session:${roomId}`;
    const cachedSessionId = sessionStorage.getItem(storageKey);
    if (cachedSessionId) {
      setGuestSessionId(cachedSessionId);
      return cachedSessionId;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/guest/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room_id: roomId,
        name: displayName,
      }),
    });

    if (!response.ok) {
      throw new Error("Unable to create guest session");
    }

    const data = await response.json();
    const sessionId = data.session_id || "";
    sessionStorage.setItem(storageKey, sessionId);
    setGuestSessionId(sessionId);
    return sessionId;
  }, [roomId]);

  // --- Join Call ---
  const joinCall = useCallback(async (room = roomId || "default-room", name) => {
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;

    const resolvedName = isLoggedIn
      ? (profileUser?.name || myName || "Host")
      : (name || myName || "Guest");
    const hostMode = Boolean(isHostUser && hostSessionId);
    let sessionId = hostMode ? hostSessionId : guestSessionId;
    setMyName(resolvedName);
    setSetupVisible(false);

    if (hostMode) {
      setRoomVisible(true);
      setIsInWaitingRoom(false);
      console.log("Host auto join, using profile identity:", resolvedName);
    } else {
      setRoomVisible(false);
      setIsInWaitingRoom(true);
      setWaitMessage("Waiting for host approval...");
    }

    setRoomName(room);

    sessionStorage.setItem("room", room);
    sessionStorage.setItem("name", resolvedName);

    try {
      if (!hostMode && !sessionId) {
        sessionId = await ensureGuestSession(resolvedName);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      cameraStreamRef.current = stream;

      const savedMic = sessionStorage.getItem("micMuted") === "true";
      const savedCam = sessionStorage.getItem("cameraOff") === "true";

      if (stream.getAudioTracks()[0] && savedMic) stream.getAudioTracks()[0].enabled = false;
      if (stream.getVideoTracks()[0] && savedCam) stream.getVideoTracks()[0].enabled = false;

      setLocalStreamHandler(stream, resolvedName);
      monitorAudioLevel(stream, "localVideoContainer");
    } catch (e) {
      hasJoinedRef.current = false;
      console.error("Media error", e);
      alert("Could not access camera and microphone.");
      return;
    }

    connectWebSocket(room, resolvedName, hostMode, sessionId);
  }, [roomId, isLoggedIn, profileUser?.name, myName, connectWebSocket, setLocalStreamHandler, isHostUser, hostSessionId, guestSessionId, ensureGuestSession]);

  useEffect(() => {
    if (!isLoggedIn) return;

    if (roomId && profileReady && meetingReady && hostAccessResolved) {
      const timer = setTimeout(() => {
        if (isHostUser && !hostSessionId) return;
        joinCall(roomId, profileUser?.name || myName || "Guest");
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [roomId, isLoggedIn, profileReady, meetingReady, hostAccessResolved, profileUser?.name, myName, joinCall, isHostUser, hostSessionId]);

  useEffect(() => {
    return () => {
      hasJoinedRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      Object.values(pcsRef.current).forEach((pc) => pc.close());
      pcsRef.current = {};

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, []);

  const approveGuest = (client_id) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "approve", target_client_id: client_id }));
      setWaitingUsers((prev) => prev.filter((u) => u.client_id !== client_id));
    }
  };

  const denyGuest = (client_id) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "deny", target_client_id: client_id }));
      setWaitingUsers((prev) => prev.filter((u) => u.client_id !== client_id));
    }
  };

  // --- Captions ---
  useEffect(() => {
    if (!captionsEnabled) return;
    const sampleCaptions = [
      "Hello everyone, how are you?",
      "Let's discuss quarterly results.",
      "Numbers look promising.",
      "Focus on marketing strategy.",
      "Schedule follow-up meeting.",
    ];
    const interval = setInterval(() => {
      if (activeSpeakerId) {
        const random = sampleCaptions[Math.floor(Math.random() * sampleCaptions.length)];
        setCaptions((prev) => ({ ...prev, [activeSpeakerId]: random }));
        setTimeout(() => setCaptions((prev) => ({ ...prev, [activeSpeakerId]: "" })), 5000);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [captionsEnabled, activeSpeakerId]);

  const localParticipant = participants.find((participant) => participant.id === "you");
  const waitingCount = waitingUsers.length;

  // --- Render ---
  if ((isLoggedIn && !profileReady) || !meetingReady || !hostAccessResolved) {
    return (
      <div className="meeting-room-shell">
        <div className="meeting-state-card">
          <h2>Loading your meeting profile</h2>
          <p>Checking room access and syncing the correct host identity before joining.</p>
        </div>
      </div>
    );
  }

  if (meetingLoadError) {
    return (
      <div className="meeting-room-shell">
        <div className="meeting-state-card">
          <h2>Meeting unavailable</h2>
          <p>{meetingLoadError}</p>
        </div>
      </div>
    );
  }

  if (setupVisible && !isLoggedIn) {
    return (
      <div id="setup" className="meeting-room-shell">
        <div className="setup-container meeting-state-card">
          <div className="setup-header">
            <i className="fas fa-video"></i>
            <h2>AI for IA Meeting</h2>
          </div>
          <div className="security-badge">
            <i className="fas fa-shield-alt"></i>
            <span>End-to-End Encrypted</span>
          </div>
          <input
            type="text"
            id="nameInput"
            placeholder="Enter Your Name"
            value={myName}
            onChange={(e) => setMyName(e.target.value)}
          />
          <button
            id="joinBtn"
            onClick={() => {
              const trimmedName = (myName || "").trim();
              if (!trimmedName) {
                alert("Please enter your name to continue.");
                return;
              }
              joinCall(roomId || "default-room", trimmedName);
            }}
          >
            <i className="fas fa-sign-in-alt"></i>
            <span>Join Meeting</span>
          </button>
        </div>
      </div>
    );
  }

  if (isInWaitingRoom) {
    return (
      <div className="meeting-room-shell">
        <div className="meeting-state-card">
          <div className="meeting-state-icon">
            <FaHourglassHalf />
          </div>
        <h2>Waiting for host approval</h2>
        <p>{waitMessage || "Please wait while the host approves your entry."}</p>
      </div>
      </div>
    );
  }

  if (roomVisible) {
    return (
      <div id="room" className="meeting-room-shell">
        {/* Header */}
        <div className="room-header">
          <div className="room-info">
            <div className="room-pill room-name">
              <FaDoorOpen />
              <span>{roomName}</span>
            </div>
            <div className="room-pill participant-count">
              <FaUsers />
              <span>{participants.length} participant(s)</span>
            </div>
            {waitingCount > 0 && (
              <div className="room-pill waiting-pill">
                <FaHourglassHalf />
                <span>{waitingCount} waiting</span>
              </div>
            )}
            {isRecording && (
              <div className="room-pill recording-indicator">
                <span className="recording-dot" />
                <span>Recording {recordingTimer}</span>
              </div>
            )}
          </div>
          <div className="security-indicator room-pill">
            <FaLock />
            <span>Secured Connection</span>
          </div>
        </div>

        {/* Waiting room requests (host only) */}
        {waitingUsers.length > 0 && (
          <div className="waiting-room-notification">
            <div className="waiting-room-heading">
              <strong>Guest requests waiting approval</strong>
              <span>{waitingUsers.length} pending</span>
            </div>
            {waitingUsers.map((user) => (
              <div key={user.client_id} className="waiting-room-row">
                <div>
                  <div className="waiting-user-name">{user.name || "Guest"}</div>
                  <div className="waiting-user-subtitle">Ready to join this room</div>
                </div>
                <div className="waiting-room-actions">
                  <button className="approve-btn" onClick={() => approveGuest(user.client_id)}>Approve</button>
                  <button className="deny-btn" onClick={() => denyGuest(user.client_id)}>Deny</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div id="main-content" className={pinnedParticipantId ? "pin-active" : ""}>
          <div id="videos" className={`participant-grid participants-${Math.min(participants.length || 1, 6)}`}>
            {participants
              .filter((p) => !pinnedParticipantId || p.id === pinnedParticipantId)
              .map((p) => (
                <VideoTile
                  key={p.id}
                  {...p}
                  captions={captions[p.id]}
                  isPinned={p.id === pinnedParticipantId}
                  isFeatured={p.id === pinnedParticipantId}
                  isMirrored={p.isLocal ? isMirrored : false}
                  onTogglePin={(id) => setPinnedParticipantId(pinnedParticipantId === id ? null : id)}
                />
              ))}
          </div>
          <div id="pinned-column">
            {participants
              .filter((p) => pinnedParticipantId && p.id !== pinnedParticipantId)
              .map((p) => (
                <VideoTile
                  key={p.id}
                  {...p}
                  captions={captions[p.id]}
                  isPinned={false}
                  isMirrored={p.isLocal ? isMirrored : false}
                  onTogglePin={(id) => setPinnedParticipantId(pinnedParticipantId === id ? null : id)}
                />
              ))}
          </div>
        </div>

        {/* Participants strip for screen share */}
        <div id="participants-strip">
          {isScreenSharing &&
            participants
              .filter((p) => !p.isLocal)
              .map((p) => (
                <VideoTile
                  key={p.id}
                  {...p}
                  captions={captions[p.id]}
                  isMirrored={p.isLocal ? isMirrored : false}
                  onTogglePin={(id) => setPinnedParticipantId(pinnedParticipantId === id ? null : id)}
                />
              ))}
        </div>

        {/* Controls */}
        <ControlsBar
          isMicOn={localParticipant?.audioEnabled ?? true}
          isCameraOn={localParticipant?.videoEnabled ?? true}
          isSharingScreen={isScreenSharing}
          isRecording={isRecording}
          captionsEnabled={captionsEnabled}
          chatOpen={chatOpen}
          isMirrored={isMirrored}
          onToggleMic={() => toggleMic()}
          onToggleCamera={() => toggleCamera()}
          onToggleMirror={() => setIsMirrored((prev) => !prev)}
          onShareScreen={() => toggleScreenShare()}
          onRecord={() => (isRecording ? stopRecording() : setRecordingModalOpen(true))}
          onCaptions={() => setCaptionsEnabled(!captionsEnabled)}
          onChat={() => setChatOpen(!chatOpen)}
          onLeave={() => leaveMeeting()}
        />

        {/* Chat Sidebar */}
        <ChatSidebar
          isOpen={chatOpen}
          messages={messages}
          onClose={() => setChatOpen(false)}
          msgInput={msgInput}
          setMsgInput={setMsgInput}
          sendMessage={() => sendChatMessage(msgInput)}
        />

        {/* Recording Modal */}
        <RecordingModal
          isOpen={recordingModalOpen}
          onClose={() => setRecordingModalOpen(false)}
          onSelectOption={(type) => console.log("Selected:", type)}
          onStartRecording={() => startRecording()}
        />
      </div>
    );
  }

  return null;
}
