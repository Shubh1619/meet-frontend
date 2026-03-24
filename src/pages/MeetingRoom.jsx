import React, { useState, useEffect, useRef } from "react";
import ControlsBar from "./ControlsBar";
import ChatSidebar from "./ChatSidebar";
import RecordingModal from "./RecordingModal";
import VideoTile from "./VideoTile";
import "./MeetingRoom.css";

export default function MeetingRoom() {
  // --- State ---
  const [setupVisible, setSetupVisible] = useState(true);
  const [roomVisible, setRoomVisible] = useState(false);
  const [roomName, setRoomName] = useState("Room Name");
  const [myName, setMyName] = useState("Guest");

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
  const myId = useRef(Math.random().toString(36).substring(2, 9));

  // --- Join Call ---
  const joinCall = async (room, name) => {
    setMyName(name);
    setSetupVisible(false);
    setRoomVisible(true);
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
        wsRef.current.send(JSON.stringify({ type: "candidate", candidate: e.candidate, from: myId.current, to: remoteId }));
      }
    };

    return pc;
  };

  // --- WebSocket ---
  const connectWebSocket = (room) => {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/${room}`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "join",
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
        case "join":
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.send(JSON.stringify({ ...pc.localDescription.toJSON(), from: myId.current, to: msg.from, name: myName }));
          break;
        case "offer":
          await pc.setRemoteDescription(new RTCSessionDescription(msg));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.send(JSON.stringify({ ...pc.localDescription.toJSON(), from: myId.current, to: msg.from, name: myName }));
          break;
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