// import React, { useEffect, useRef, useState, useMemo } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { useDarkMode } from "../context/DarkModeContext";
// import {
//   FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash,
//   FaStopCircle, FaCircle, FaUsers, FaRobot,
//   FaStickyNote, FaComment, FaTimes, FaUser,
//   FaChevronRight, FaThumbtack
// } from "react-icons/fa";
// import { MdScreenShare, MdStopScreenShare } from "react-icons/md";

// export default function MeetingRoom() {
//   const navigate = useNavigate();
//   const { darkMode } = useDarkMode();
//   const { roomId } = useParams();

//   const localVideoRef = useRef(null);
//   const rawVideoRef = useRef(null);
//   const mediaRecorderRef = useRef(null);

//   const [guestName, setGuestName] = useState("");
//   const [isJoined, setIsJoined] = useState(false);
//   const [cameraStream] = useState(null);
//   const [screenStream] = useState(null);
//   const [isMicOn, setIsMicOn] = useState(() => localStorage.getItem("isMicOn") !== "false");
//   const [isCameraOn, setIsCameraOn] = useState(() => localStorage.getItem("isCameraOn") !== "false");
//   const [isScreenSharing, setIsScreenSharing] = useState(false);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isPinned, setIsPinned] = useState(false);

//   const [participants, setParticipants] = useState([]);
//   const [waitingRoomUsers, setWaitingRoomUsers] = useState([]);
//   const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
//   const [waitingRoomStatus, setWaitingRoomStatus] = useState(null);

//   const peersRef = useRef({});
//   const socketRef = useRef(null);

//   const [rightPanel, setRightPanel] = useState("ai");
//   const [chatMessages, setChatMessages] = useState([]);
//   const [msgInput, setMsgInput] = useState("");
//   const [notes, setNotes] = useState("");
//   const [aiSummary, setAiSummary] = useState("AI summary will appear here...");
//   const [actionItems, setActionItems] = useState([]);
//   const [aiLoading, setAiLoading] = useState(false);

//   const token = localStorage.getItem("token");
//   const storedUser = useMemo(() => {
//     try {
//       return JSON.parse(localStorage.getItem("user") || "{}");
//     } catch {
//       return {};
//     }
//   }, []);

//   useEffect(() => {
//     if (!roomId) navigate("/dashboard");
//   }, [roomId]);

//   useEffect(() => {
//     if (isJoined) {
//       setParticipants([{
//         id: "you",
//         name: guestName || storedUser?.name || "You",
//         isMuted: false,
//         isVideoOn: true,
//         isLocal: true
//       }]);
//     }
//   }, [isJoined, guestName, storedUser]);

//   useEffect(() => {
//     if (token && storedUser?.name) {
//       setGuestName(storedUser.name);
//     }
//   }, [token, storedUser]);

//   const handleJoin = () => {
//     if (guestName.trim()) {
//       if (token) {
//         // Host user, join directly
//         setIsJoined(true);
//       } else {
//         // Guest user, request approval
//         if (socketRef.current?.readyState === WebSocket.OPEN) {
//           socketRef.current.send(JSON.stringify({
//             type: 'waiting-room-request',
//             user: { name: guestName.trim(), id: roomId }
//           }));
//         }
//         setIsInWaitingRoom(true);
//       }
//     }
//   };

//   const handleWaitingRoomResponse = (data) => {
//     if (data.approved) {
//       setIsInWaitingRoom(false);
//       setIsJoined(true);
//     } else {
//       setWaitingRoomStatus({ rejected: true, reason: data.reason || "Entry denied by host" });
//     }
//   };

//   const approveUser = (userName) => {
//     if (socketRef.current?.readyState === WebSocket.OPEN) {
//       socketRef.current.send(JSON.stringify({
//         type: 'waiting-room-response',
//         to: userName,
//         approved: true
//       }));
//     }
//     setWaitingRoomUsers(prev => prev.filter(u => u.name !== userName));
//   };

//   const rejectUser = (userName) => {
//     if (socketRef.current?.readyState === WebSocket.OPEN) {
//       socketRef.current.send(JSON.stringify({
//         type: 'waiting-room-response',
//         to: userName,
//         approved: false,
//         reason: "Entry denied by host"
//       }));
//     }
//     setWaitingRoomUsers(prev => prev.filter(u => u.name !== userName));
//   };

//   const bgColor = darkMode ? "#0f0f23" : "#F8F9FF";
//   const cardBg = darkMode ? "#1a1a2e" : "#ffffff";
//   const textColor = darkMode ? "#e4e4e7" : "#1E1E2F";
//   const mutedColor = darkMode ? "#888" : "#666";
//   const accentColor = "#6759FF";
//   const borderColor = darkMode ? "#2a2a3e" : "#e8e8f0";

//   const getCtrlBtnStyle = (active, activeColor) => ({
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//     gap: 4,
//     padding: "10px 16px",
//     borderRadius: 12,
//     border: active ? "none" : `1px solid ${borderColor}`,
//     background: active ? activeColor : (darkMode ? "#252540" : "#ffffff"),
//     color: active ? "#fff" : textColor,
//     cursor: "pointer",
//     fontSize: "0.75rem",
//     fontWeight: 600,
//     minWidth: 70,
//   });

//   // --- Render Logic ---
//   if (!isJoined) {
//     const isLoggedIn = !!token;

//     if (isInWaitingRoom && !waitingRoomStatus) {
//       return (
//         <div style={{ minHeight: "100vh", background: bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
//           <div style={{ background: cardBg, borderRadius: 20, padding: 40, maxWidth: 420, textAlign: "center" }}>
//             <h2 style={{ color: textColor }}>Waiting Room</h2>
//             <p style={{ color: mutedColor }}>Please wait while the host reviews your request...</p>
//             <div style={{ color: textColor }}>Name: {guestName}</div>
//             <button onClick={() => { setIsInWaitingRoom(false); setGuestName(""); }}>Cancel</button>
//           </div>
//         </div>
//       );
//     }

//     if (waitingRoomStatus?.rejected) {
//       return (
//         <div style={{ minHeight: "100vh", background: bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
//           <div style={{ background: cardBg, borderRadius: 20, padding: 40, maxWidth: 420, textAlign: "center" }}>
//             <h2 style={{ color: textColor }}>Entry Denied</h2>
//             <p style={{ color: mutedColor }}>{waitingRoomStatus.reason}</p>
//             <button onClick={() => { setWaitingRoomStatus(null); navigate("/dashboard"); }}>Return to Dashboard</button>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div style={{ minHeight: "100vh", background: bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
//         <div style={{ background: cardBg, borderRadius: 20, padding: 40, maxWidth: 420, textAlign: "center" }}>
//           <h2 style={{ color: textColor }}>Join Meeting</h2>
//           <p style={{ color: mutedColor }}>
//             {isLoggedIn
//               ? `Welcome back, ${storedUser?.name || "User"}! Click below to join.`
//               : "Enter your name to join the meeting"}
//           </p>

//           {!isLoggedIn && (
//             <input
//               type="text"
//               placeholder="Enter your name"
//               value={guestName}
//               onChange={(e) => setGuestName(e.target.value)}
//               onKeyPress={(e) => e.key === "Enter" && handleJoin()}
//               style={{
//                 width: "100%",
//                 padding: "14px 16px",
//                 border: `1px solid ${borderColor}`,
//                 borderRadius: 12,
//                 marginBottom: 16,
//               }}
//             />
//           )}

//                   <button
//             onClick={handleJoin}
//             disabled={!isLoggedIn && !guestName.trim()}
//             style={{
//               width: "100%",
//               padding: "14px",
//               background:
//                 isLoggedIn || guestName.trim()
//                   ? "linear-gradient(135deg, #6759FF, #8B7FFF)"
//                   : "#ccc",
//               color: "#fff",
//               border: "none",
//               borderRadius: 12,
//               fontSize: "1rem",
//               fontWeight: 600,
//               cursor: isLoggedIn || guestName.trim() ? "pointer" : "not-allowed",
//             }}
//           >
//             Join Meeting
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // --- MAIN MEETING ROOM ---
//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: bgColor,
//         paddingTop: 60,
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       <video ref={rawVideoRef} style={{ display: "none" }} autoPlay muted playsInline />

//       {/* HEADER */}
//       <header
//         style={{
//           position: "fixed",
//           top: 0,
//           left: 0,
//           right: 0,
//           height: 60,
//           background: cardBg,
//           borderBottom: `1px solid ${borderColor}`,
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "0 24px",
//           zIndex: 100,
//         }}
//       >
//         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//           <div
//             style={{
//               width: 38,
//               height: 38,
//               borderRadius: 10,
//               background: "linear-gradient(135deg, #6759FF, #8B7FFF)",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               color: "#fff",
//               fontWeight: 700,
//               fontSize: "1rem",
//             }}
//           >
//             M
//           </div>
//           <div style={{ fontWeight: 600, color: textColor }}>Meetify Meeting</div>
//         </div>

//         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//           {waitingRoomUsers.length > 0 && (
//             <button
//               onClick={() => setRightPanel("waiting-room")}
//               style={{
//                 padding: "8px 14px",
//                 background: "linear-gradient(135deg, #FFA500, #FF6B35)",
//                 border: "none",
//                 borderRadius: 8,
//                 cursor: "pointer",
//                 color: "#fff",
//                 fontWeight: 600,
//               }}
//             >
//               <FaUser /> {waitingRoomUsers.length} in Waiting Room
//             </button>
//           )}

//           <button
//             onClick={() => setRightPanel("participants")}
//             style={{
//               padding: "8px 14px",
//               background: "linear-gradient(135deg, #6759FF, #8B7FFF)",
//               border: "none",
//               borderRadius: 8,
//               cursor: "pointer",
//               color: "#fff",
//               fontWeight: 600,
//             }}
//           >
//             <FaUsers /> {participants.length}
//           </button>

//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 8,
//               padding: "6px 10px",
//               background: darkMode ? "#252540" : "#f5f5ff",
//               borderRadius: 8,
//             }}
//           >
//             <div
//               style={{
//                 width: 32,
//                 height: 32,
//                 borderRadius: "50%",
//                 background: "linear-gradient(135deg, #6759FF, #8B7FFF)",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 color: "#fff",
//                 fontWeight: 600,
//               }}
//             >
//               {(guestName || "?").charAt(0).toUpperCase()}
//             </div>
//             <span style={{ color: textColor }}>{guestName}</span>
//           </div>
//         </div>
//       </header>

//       {/* VIDEO GRID */}
//       <div style={{ flex: 1, display: "flex", marginTop: 60 }}>
//         <div style={{ flex: 1, padding: 20 }}>
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns:
//                 participants.length === 1
//                   ? "1fr"
//                   : participants.length === 2
//                   ? "1fr 1fr"
//                   : "repeat(auto-fit, minmax(300px, 1fr))",
//               gap: 16,
//             }}
//           >
//             {participants.map((p) => (
//               <div key={p.id} style={{ background: "#000", borderRadius: 16 }}>
//                 {p.isLocal ? (
//                   isCameraOn ? (
//                     <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%" }} />
//                   ) : (
//                     <div style={{ color: "#fff", textAlign: "center", padding: 20 }}>{p.name}</div>
//                   )
//                 ) : p.stream ? (
//                   <video
//                     ref={(el) => {
//                       if (el && p.stream) el.srcObject = p.stream;
//                     }}
//                     autoPlay
//                     playsInline
//                     style={{ width: "100%", height: "100%" }}
//                   />
//                 ) : (
//                   <div style={{ color: "#fff", textAlign: "center", padding: 20 }}>{p.name}</div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* RIGHT PANEL */}
//         <div style={{ width: 380, background: cardBg, borderLeft: `1px solid ${borderColor}` }}>
//           {/* Tabs */}
//           <div style={{ display: "flex", borderBottom: `1px solid ${borderColor}` }}>
//             {["ai", "chat", "notes", "waiting-room", "participants"].map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setRightPanel(tab)}
//                 style={{
//                   flex: 1,
//                   padding: "12px",
//                   background: rightPanel === tab ? accentColor : "transparent",
//                   color: rightPanel === tab ? "#fff" : mutedColor,
//                   border: "none",
//                   cursor: "pointer",
//                 }}
//               >
//                 {tab}
//               </button>
//             ))}
//           </div>

//           {/* Panel Content */}
//           <div style={{ padding: 16 }}>
//             {rightPanel === "chat" && (
//               <div>
//                 {chatMessages.map((msg, i) => (
//                   <div key={i} style={{ marginBottom: 8 }}>
//                     <strong>{msg.from}</strong>: {msg.text}
//                   </div>
//                 ))}
//                 <input
//                   value={msgInput}
//                   onChange={(e) => setMsgInput(e.target.value)}
//                   onKeyPress={(e) => e.key === "Enter" && sendMessage()}
//                   placeholder="Type a message..."
//                 />
//               </div>
//             )}
//             {rightPanel === "notes" && (
//               <textarea
//                 value={notes}
//                 onChange={(e) => setNotes(e.target.value)}
//                 placeholder="Write meeting notes..."
//                 style={{ width: "100%", height: 200 }}
//               />
//             )}
//             {rightPanel === "waiting-room" &&
//               waitingRoomUsers.map((u) => (
//                 <div key={u.name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
//                   <span>{u.name}</span>
//                   <div>
//                     <button onClick={() => approveUser(u.name)}>Approve</button>
//                     <button onClick={() => rejectUser(u.name)}>Reject</button>
//                   </div>
//                 </div>
//               ))}
//             {rightPanel === "participants" &&
//               participants.map((p) => <div key={p.id}>{p.name}</div>)}
//           </div>
//         </div>
//       </div>

//       {/* CONTROLS BAR */}
//       <div
//         style={{
//           background: cardBg,
//           borderTop: `1px solid ${borderColor}`,
//           padding: "16px",
//           display: "flex",
//           justifyContent: "center",
//           gap: 10,
//         }}
//       >
//         <button onClick={() => setIsMicOn(!isMicOn)} style={getCtrlBtnStyle(!isMicOn, "#FF4757")}>
//           {isMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
//           <span>{isMicOn ? "Mute" : "Unmute"}</span>
//         </button>
//         <button onClick={() => setIsCameraOn(!isCameraOn)} style={getCtrlBtnStyle(!isCameraOn, "#FF4757")}>
//           {isCameraOn ? <FaVideo /> : <FaVideoSlash />}
//           <span>{isCameraOn ? "Stop Video" : "Start Video"}</span>
//         </button>
//         <button
//           onClick={() => setIsScreenSharing(!isScreenSharing)}
//           style={getCtrlBtnStyle(isScreenSharing, "#6759FF")}
//         >
//           {isScreenSharing ? <MdStopScreenShare /> : <MdScreenShare />}
//           <span>{isScreenSharing ? "Stop Share" : "Share Screen"}</span>
//         </button>

//         <button
//           onClick={() => setIsRecording(!isRecording)}
//           style={getCtrlBtnStyle(isRecording, "#FF4757")}
//         >
//           {isRecording ? <FaStopCircle /> : <FaCircle />}
//           <span>{isRecording ? "Stop Rec" : "Record"}</span>
//         </button>

//         <button
//           onClick={() => {
//             // cleanup before leaving
//             if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
//             if (screenStream) screenStream.getTracks().forEach(t => t.stop());
//             if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
//             Object.values(peersRef.current).forEach(peer => peer.close());
//             if (socketRef.current) socketRef.current.close();
//             navigate("/dashboard");
//           }}
//           style={{
//             ...getCtrlBtnStyle(false, "#FF4757"),
//             background: "linear-gradient(135deg, #FF4757, #FF6B7A)",
//             marginLeft: 16,
//           }}
//         >
//           <FaTimes />
//           <span>Leave</span>
//         </button>
//       </div>

//       {/* Animations */}
//       <style>{`
//         @keyframes pulse {
//           0%, 100% { opacity: 1; }
//           50% { opacity: 0.4; }
//         }
//         @keyframes sharePulse {
//           0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4); }
//           50% { transform: scale(1.02); box-shadow: 0 6px 20px rgba(255, 71, 87, 0.6); }
//         }
//       `}</style>
//     </div>
//   );
// }

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