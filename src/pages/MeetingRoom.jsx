import React, { useState, useEffect, useRef } from "react";
import ControlsBar from "./ControlsBar";
import ChatSidebar from "./ChatSidebar";
import RecordingModal from "./RecordingModal";
import VideoTile from "./VideoTile";
import "./MeetingRoom.css";

export default function MeetingRoom() {
  // --- State ---
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const [setupVisible, setSetupVisible] = useState(true);
  const [roomVisible, setRoomVisible] = useState(false);
  const [roomName, setRoomName] = useState("Room Name");
  const [myName, setMyName] = useState(storedUser?.name || "Guest");
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [waitMessage, setWaitMessage] = useState("");
  const [participants, setParticipants] = useState([]);
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

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

  useEffect(() => {
    if (!myId.current) {
      myId.current = Math.random().toString(36).substring(2, 10);
    }
  }, []);

  // --- Join Call ---
  const joinCall = async (room, name) => {
    const resolvedName = isLoggedIn ? myName : name || myName || "Guest";
    setMyName(resolvedName);
    setSetupVisible(false);

    if (isLoggedIn) {
      setRoomVisible(true);
      setIsInWaitingRoom(false);
      console.log("Logged in user, using profile identity:", resolvedName);
    } else {
      setRoomVisible(false);
      setIsInWaitingRoom(true);
      setWaitMessage("Waiting for host approval...");
    }

    setRoomName(room);

    sessionStorage.setItem("room", room);
    sessionStorage.setItem("name", name);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      cameraStreamRef.current = stream;

      const savedMic = sessionStorage.getItem("micMuted") === "true";
      const savedCam = sessionStorage.getItem("cameraOff") === "true";

      if (stream.getAudioTracks()[0] && savedMic) stream.getAudioTracks()[0].enabled = false;
      if (stream.getVideoTracks()[0] && savedCam) stream.getVideoTracks()[0].enabled = false;

      setLocalStreamHandler(stream);
      monitorAudioLevel(stream, "localVideoContainer");
    } catch (e) {
      console.error("Media error", e);
      alert("Could not access camera and microphone.");
      return;
    }

    connectWebSocket(room);
  };

  // --- Local Stream Handler ---
  const setLocalStreamHandler = (stream) => {
    localStreamRef.current = stream;
    setParticipants((prev) => {
      const exists = prev.find((p) => p.id === "you");
      if (exists) {
        return prev.map((p) => (p.id === "you" ? { ...p, stream } : p));
      } else {
        return [...prev, { id: "you", name: myName, stream, audioEnabled: true, videoEnabled: true, isLocal: true }];
      }
    });
  };

  const monitorAudioLevel = (stream, id) => {
    if (!id) return;
    setActiveSpeakerId(id);
  };

  const sendStateUpdate = () => {
    const local = participants.find((p) => p.id === "you");
    if (!local) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "update-state",
        id: "you",
        audioEnabled: local.audioEnabled,
        videoEnabled: local.videoEnabled,
      }));
    }
  };

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setParticipants((prev) =>
      prev.map((p) => (p.id === "you" ? { ...p, audioEnabled: track.enabled } : p))
    );
    sendStateUpdate();
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setParticipants((prev) =>
      prev.map((p) => (p.id === "you" ? { ...p, videoEnabled: track.enabled } : p))
    );
    sendStateUpdate();
  };

  const toggleScreenShare = () => setIsScreenSharing((prev) => !prev);
  const startRecording = () => {
    setIsRecording(true);
    setRecordingTimer("00:00");
  };
  const stopRecording = () => setIsRecording(false);
  const leaveMeeting = () => {
    setRoomVisible(false);
    setSetupVisible(true);
    setParticipants([]);
  };
  const sendChatMessage = (message) => {
    if (!message) return;
    setMessages((prev) => [...prev, { from: myName || "Guest", text: message, time: new Date().toLocaleTimeString(), own: true }]);
    setMsgInput("");
  };

  // --- Peer Connection ---
  const createPeerConnection = (remoteId, remoteName, audioEnabled, videoEnabled) => {
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
        wsRef.current.send(JSON.stringify({ type: "candidate", candidate: e.candidate, from: myId, to: remoteId }));
      }
    };

    return pc;
  };

  // --- WebSocket ---
  const connectWebSocket = (room) => {
    const WS_SERVER = import.meta.env.VITE_WS_URL;
    const wsUrl = `${WS_SERVER}/ws/${room}`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      const joinType = isLoggedIn ? "host-join" : "waiting-room-request";
      socket.send(
        JSON.stringify({
          type: joinType,
          from: myId.current,
          name: myName,
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
            if (prev.find((u) => u.client_id === msg.client_id)) return prev;
            return [...prev, { client_id: msg.client_id, name: msg.name }];
          });
          return;

        case "user-joined":
          if (msg.id === myId.current) return;
          setParticipants((prev) => {
            if (prev.some((p) => p.id === msg.id)) return prev;
            return [...prev, { id: msg.id, name: msg.name, isLocal: false, audioEnabled: true, videoEnabled: true }];
          });

          if (!pcsRef.current[msg.id]) {
            const peer = createPeerConnection(msg.id, msg.name, true, true);
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            wsRef.current?.send(JSON.stringify({ ...peer.localDescription.toJSON(), from: myId.current, to: msg.id, name: myName }));
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
          socket.send(JSON.stringify({ ...pc.localDescription.toJSON(), from: myId, to: msg.from, name: myName }));
          break;
        }
        case "offer": {
          await pc.setRemoteDescription(new RTCSessionDescription(msg));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.send(JSON.stringify({ ...pc.localDescription.toJSON(), from: myId, to: msg.from, name: myName }));
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
        case "user-left":
          if (pcsRef.current[msg.id]) {
            pcsRef.current[msg.id].close();
            delete pcsRef.current[msg.id];
          }
          setParticipants((prev) => prev.filter((p) => p.id !== msg.id));
          break;
      }
    };

    socket.onclose = () => {
      if (captionsEnabled) setCaptionsEnabled(false);
      if (isRecording) setIsRecording(false);
      setTimeout(() => connectWebSocket(room), 5000);
    };
  };

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

  // --- Render ---
  if (setupVisible) {
    return (
      <div id="setup">
        <div className="setup-container">
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
          <button id="joinBtn" onClick={() => joinCall("default-room", myName || "Guest")}>
            <i className="fas fa-sign-in-alt"></i>
            <span>Join Meeting</span>
          </button>
        </div>
      </div>
    );
  }

  if (isInWaitingRoom) {
    return (
      <div style={{ textAlign: "center", margin: "120px auto" }}>
        <h2>Waiting for host approval</h2>
        <p>{waitMessage || "Please wait while the host approves your entry."}</p>
      </div>
    );
  }

  if (roomVisible) {
    return (
      <div id="room">
        {/* Header */}
        <div className="room-header">
          <div className="room-info">
            <div className="room-name">
              <i className="fas fa-door-open"></i>
              <span>{roomName}</span>
            </div>
            <div className="participant-count">
              <i className="fas fa-users"></i>
              <span>{participants.length} participant(s)</span>
            </div>
            {isRecording && (
              <div className="recording-indicator">
                <i className="fas fa-circle"></i>
                <span>Recording {recordingTimer}</span>
              </div>
            )}
          </div>
          <div className="security-indicator">
            <i className="fas fa-lock"></i>
            <span>Secured Connection</span>
          </div>
        </div>

        {/* Waiting room requests (host only) */}
        {waitingUsers.length > 0 && (
          <div className="waiting-room-notification" style={{ padding: "10px", background: "#fffae5", border: "1px solid #ffecb5", margin: "12px" }}>
            <strong>Guest requests waiting approval:</strong>
            {waitingUsers.map((user) => (
              <div key={user.client_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                <span>{user.name}</span>
                <span style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => approveGuest(user.client_id)}>Approve</button>
                  <button onClick={() => denyGuest(user.client_id)}>Deny</button>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div id="main-content" className={pinnedParticipantId ? "pin-active" : ""}>
          <div id="videos">
            {participants
              .filter((p) => !pinnedParticipantId || p.id === pinnedParticipantId)
              .map((p) => (
                <VideoTile
                  key={p.id}
                  {...p}
                  captions={captions[p.id]}
                  isPinned={p.id === pinnedParticipantId}
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
                  onTogglePin={(id) => setPinnedParticipantId(pinnedParticipantId === id ? null : id)}
                />
              ))}
        </div>

        {/* Controls */}
        <ControlsBar
          onToggleMic={() => toggleMic()}
          onToggleCamera={() => toggleCamera()}
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