import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";
import {
  FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash,
  FaDesktop, FaStopCircle, FaCircle, FaUsers, FaRobot,
  FaStickyNote, FaComment, FaLock, FaTimes, FaUser,
  FaCopy, FaDownload, FaSignOutAlt, FaChevronRight, FaThumbtack
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
  // eslint-disable-next-line no-unused-vars
  const [isSpeaking, setIsSpeaking] = useState(false);

  const peersRef = useRef({});
  const socketRef = useRef(null);

  const isMicOnRef = useRef(isMicOn);
  const isSpeakingRef = useRef(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [rightPanel, setRightPanel] = useState("ai");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const meetingPin = useMemo(() => Math.floor(100000 + Math.random() * 900000).toString(), []);
  const [pinCopied, setPinCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [notes, setNotes] = useState("");
  const [aiSummary, setAiSummary] = useState("AI summary will appear here as the meeting progresses...");
  const [actionItems, setActionItems] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Check if user is logged in
  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!roomId) {
      navigate("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Update peer connections when camera stream changes
  useEffect(() => {
    if (cameraStream) {
      Object.values(peersRef.current).forEach(peer => {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(cameraStream.getVideoTracks()[0]);
        } else {
          cameraStream.getTracks().forEach(track => {
            peer.addTrack(track, cameraStream);
          });
        }
      });
    }
  }, [cameraStream]);

  // Auto-join if logged in
  useEffect(() => {
    if (token && storedUser?.name) {
      setGuestName(storedUser.name);
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'host-join',
          from: storedUser.name
        }));
      }
      setIsJoined(true);
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
      socketRef.current?.send(JSON.stringify({
        type: 'waiting-room-request',
        user: userData
      }));
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
    socketRef.current?.send(JSON.stringify({
      type: 'waiting-room-response',
      from: guestName || storedUser?.name,
      to: userName,
      approved: true
    }));
    setWaitingRoomUsers(prev => prev.filter(u => u.name !== userName));
  };

  const rejectUser = (userName) => {
    socketRef.current?.send(JSON.stringify({
      type: 'waiting-room-response',
      from: guestName || storedUser?.name,
      to: userName,
      approved: false,
      reason: "Entry denied by host"
    }));
    setWaitingRoomUsers(prev => prev.filter(u => u.name !== userName));
  };

  const copyPin = () => {
    navigator.clipboard.writeText(meetingPin);
    setPinCopied(true);
    setTimeout(() => setPinCopied(false), 2000);
  };

  useEffect(() => {
    if (!isJoined) return;

    let mounted = true;
    let localStream = null;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1000, height: 700 },
          audio: true,
        });

        localStream = stream;
        cameraStreamRef.current = stream;

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setCameraStream(stream);

        // Check if camera was disabled before refresh
        const savedCameraOn = localStorage.getItem("isCameraOn");
        if (savedCameraOn === "false") {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.enabled = false;
            setIsCameraOn(false);
          }
        }

        // Check if mic was muted before refresh
        const savedMicOn = localStorage.getItem("isMicOn");
        if (savedMicOn === "false") {
          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = false;
            setIsMicOn(false);
          }
        }

        if (rawVideoRef.current) {
          rawVideoRef.current.srcObject = stream;
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Set up audio analysis for speech detection
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

        const detectSpeech = () => {
          if (!analyserRef.current || !isMicOnRef.current) {
            if (isSpeakingRef.current !== false) {
              setIsSpeaking(false);
              isSpeakingRef.current = false;
            }
            animationFrameRef.current = requestAnimationFrame(detectSpeech);
            return;
          }

          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const speaking = average > 20;

          if (speaking !== isSpeakingRef.current) {
            setIsSpeaking(speaking);
            isSpeakingRef.current = speaking;
            setParticipants(prev => prev.map(p => 
              p.id === "you" ? { ...p, isSpeaking: speaking } : p
            ));
          }

          animationFrameRef.current = requestAnimationFrame(detectSpeech);
        };

        detectSpeech();
      } catch (err) {
        console.error("Camera error:", err);
      }
    }

    initCamera();

    return () => {
      mounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isJoined]);

  const handleSignalingData = useCallback((data) => {
    const { type, from, ...payload } = data;

    switch (type) {
      case 'join':
        if (from === (guestName || storedUser?.name || 'Anonymous')) {
          break;
        }
        if (!peersRef.current[from]) {
          createPeerConnection(from, true);
        }
        break;
      case 'offer':
        if (!peersRef.current[from]) {
          createPeerConnection(from, false);
        }
        peersRef.current[from]?.setRemoteDescription(new RTCSessionDescription(payload));
        createAnswer(from);
        break;
      case 'answer':
        peersRef.current[from]?.setRemoteDescription(new RTCSessionDescription(payload));
        break;
      case 'ice-candidate':
        if (peersRef.current[from]) {
          peersRef.current[from].addIceCandidate(new RTCIceCandidate(payload));
        }
        break;
      default:
        break;
    }
  }, [guestName, storedUser]);

  // WebRTC signaling and peer connections
  useEffect(() => {
    if (!roomId) return;

    let socket = null;
    let retryCount = 0;
    const maxRetries = 6;
    let retryTimeout = null;

    const buildWsUrl = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = window.location.host || 'localhost:8000';
      // If running in local development and host is not backend, default to localhost:8000
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        return `${protocol}://localhost:8000/ws/${roomId}`;
      }
      return `${protocol}://${host}/ws/${roomId}`;
    };

    const connect = () => {
      const wsUrl = buildWsUrl();
      console.log('WebSocket connecting to', wsUrl);
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('Connected to signaling server');
        retryCount = 0;

        if (token && storedUser?.name) {
          socket.send(JSON.stringify({
            type: 'host-join',
            from: storedUser.name
          }));
          setIsJoined(true);
        }
      };

      socket.onmessage = (message) => {
        const data = JSON.parse(message.data);

        if (data.type === 'waiting-room-request') {
          setWaitingRoomUsers(prev => {
            if (prev.find(u => u.name === data.user.name)) return prev;
            return [...prev, data.user];
          });
          return;
        }

        if (data.type === 'waiting-room-response') {
          handleWaitingRoomResponse(data);
          return;
        }

        if (data.type === 'host-join') {
          setIsInWaitingRoom(false);
          setIsJoined(true);
          return;
        }

        handleSignalingData(data);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socket.onclose = (event) => {
        console.warn('WebSocket closed', event.code, event.reason);
        if (retryCount < maxRetries) {
          retryCount += 1;
          const delay = Math.min(3000 * retryCount, 15000);
          retryTimeout = setTimeout(connect, delay);
          console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${retryCount})`);
        }
      };
    };

    connect();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (socket) socket.close();
      Object.values(peersRef.current).forEach(peer => peer.close());
      peersRef.current = {};
    };
  }, [roomId, token, storedUser, handleSignalingData]);

  const createPeerConnection = useCallback((peerId, isInitiator) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    peersRef.current[peerId] = peer;

    // Add local stream tracks
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        peer.addTrack(track, cameraStream);
      });
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          from: guestName || storedUser?.name || 'Anonymous',
          to: peerId,
          ...event.candidate
        }));
      }
    };

    peer.ontrack = (event) => {
      setParticipants(prev => {
        const existing = prev.find(p => p.id === peerId);
        if (!existing) {
          return [...prev, {
            id: peerId,
            name: peerId,
            isMuted: false,
            isVideoOn: true,
            stream: event.streams[0],
            isLocal: false
          }];
        }
        return prev.map(p => p.id === peerId ? { ...p, stream: event.streams[0] } : p);
      });
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        console.log('Peer connected:', peerId);
      }
    };

    if (isInitiator) {
      createOffer(peerId);
    }
  }, [cameraStream, createOffer, guestName, storedUser]);

  const createOffer = useCallback(async (peerId) => {
    const peer = peersRef.current[peerId];
    if (!peer) return;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socketRef.current.send(JSON.stringify({
      type: 'offer',
      from: guestName || storedUser?.name || 'Anonymous',
      to: peerId,
      ...offer
    }));
  }, [guestName, storedUser]);

  const createAnswer = useCallback(async (peerId) => {
    const peer = peersRef.current[peerId];
    if (!peer) return;
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socketRef.current.send(JSON.stringify({
      type: 'answer',
      from: guestName || storedUser?.name || 'Anonymous',
      to: peerId,
      ...answer
    }));
  }, [guestName, storedUser]);

  // Notify others when joining
  useEffect(() => {
    if (isJoined && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'join',
        from: guestName || storedUser?.name || 'Anonymous'
      }));
    }
  }, [isJoined, guestName, storedUser]);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, isScreenSharing]);

  useEffect(() => {
    if (localVideoRef.current && cameraStream) {
      localVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isCameraOn, isScreenSharing]);

  const toggleMic = () => {
    if (!cameraStream) return;
    const track = cameraStream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      const newMicState = track.enabled;
      setIsMicOn(newMicState);
      isMicOnRef.current = newMicState;
      localStorage.setItem("isMicOn", newMicState);
      setParticipants(prev => prev.map(p => 
        p.id === "you" ? { ...p, isMuted: !newMicState, isSpeaking: false } : p
      ));
      if (!newMicState) {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }
    }
  };

  const toggleCamera = () => {
    const currentStream = cameraStreamRef.current;
    if (!currentStream) return;

    const videoTrack = currentStream.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOn(videoTrack.enabled);
    localStorage.setItem("isCameraOn", videoTrack.enabled);

    setParticipants(prev => prev.map(p => 
      p.id === "you" ? { ...p, isVideoOn: videoTrack.enabled } : p
    ));

    if (localVideoRef.current && currentStream) {
      localVideoRef.current.srcObject = currentStream;
    }
  };

  const startScreenShare = async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      setScreenStream(screen);
      setIsScreenSharing(true);

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screen;
      }

      screen.getVideoTracks()[0].onended = () => stopScreenShare();
      
      if (cameraStream && localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
      }
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    if (cameraStream && localVideoRef.current) {
      localVideoRef.current.srcObject = cameraStream;
    }
  };

  const startRecording = async () => {
    try {
      // Direct screen capture for recording
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: true,
        surfaceSwitching: 'include',
        selfBrowserSurface: 'include',
        systemAudio: 'include'
      });

      const micTracks = cameraStream ? cameraStream.getAudioTracks() : [];
      const recordingStream = new MediaStream();

      // Add screen video tracks
      screenStream.getVideoTracks().forEach((t) => recordingStream.addTrack(t));
      
      // Add system audio if available
      screenStream.getAudioTracks().forEach((t) => {
        if (t.label.toLowerCase().includes('system') || t.label.toLowerCase().includes('audio')) {
          recordingStream.addTrack(t);
        }
      });
      
      // Add microphone audio
      micTracks.forEach((t) => recordingStream.addTrack(t));

      // Store the recording stream
      recordingStreamRef.current = recordingStream;

      recordedChunksRef.current = [];
      
      // Determine available mimeType
      let mimeType = 'video/webm; codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm; codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
      
      const recorder = new MediaRecorder(recordingStream, {
        mimeType: mimeType,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `meetify-${Date.now()}.webm`;
        a.click();
        
        // Stop all tracks from recording stream
        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach(track => track.stop());
          recordingStreamRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);

      // Auto-stop when user stops sharing via browser UI
      screenStream.getVideoTracks()[0].onended = () => stopRecording();
    } catch (err) {
      console.error("Recording error:", err);
      alert("Recording failed. Please allow screen access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    
    // Stop all tracks from recording stream
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach(track => track.stop());
      recordingStreamRef.current = null;
    }
  };

  const leaveMeeting = () => {
    if (isRecording) stopRecording();
    if (isScreenSharing) stopScreenShare();
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    navigate("/dashboard");
  };

  const sendMessage = () => {
    if (!msgInput.trim()) return;
    setChatMessages((prev) => [...prev, { from: guestName, text: msgInput, time: new Date().toLocaleTimeString() }]);
    setMsgInput("");
  };

  const generateAISummary = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiSummary("Based on the meeting discussion, the team has agreed on key points and next steps. All participants actively contributed to the discussion.");
      setActionItems([
        { id: 1, task: "Review project documentation", assignee: guestName, status: "pending" },
        { id: 2, task: "Schedule follow-up meeting", assignee: guestName, status: "pending" },
      ]);
      setAiLoading(false);
    }, 1500);
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
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

  const tabs = [
    { id: "ai", icon: <FaRobot />, label: "AI" },
    { id: "chat", icon: <FaComment />, label: "Chat" },
    { id: "notes", icon: <FaStickyNote />, label: "Notes" },
    { id: "waiting-room", icon: <FaUser />, label: "Waiting" },
    { id: "participants", icon: <FaUsers />, label: "Team" },
  ];

  // Guest Join Screen / Waiting Room
  if (!isJoined) {
    const isLoggedIn = !!token;
    
    // Waiting room status screen
    if (isInWaitingRoom && !waitingRoomStatus) {
      return (
        <div style={{
          minHeight: "100vh",
          background: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Andika', sans-serif",
        }}>
          <div style={{
            background: cardBg,
            borderRadius: 20,
            padding: 40,
            maxWidth: 420,
            width: "90%",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            border: `1px solid ${borderColor}`,
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FFA500, #FF6B35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              animation: "pulse 2s infinite",
            }}>
              <FaUser style={{ fontSize: "1.8rem", color: "#fff" }} />
            </div>

            <h2 style={{ color: textColor, marginBottom: 8, fontSize: "1.5rem" }}>Waiting Room</h2>
            <p style={{ color: mutedColor, marginBottom: 24, fontSize: "0.9rem" }}>
              Please wait while the host reviews your request...
            </p>

            <div style={{
              padding: 16,
              background: darkMode ? "#252540" : "#f8f8ff",
              borderRadius: 12,
              border: `1px solid ${borderColor}`,
              marginBottom: 16,
            }}>
              <div style={{ color: textColor, fontWeight: 600, marginBottom: 8 }}>Your Details</div>
              <div style={{ color: mutedColor, fontSize: "0.9rem" }}>Name: {guestName}</div>
            </div>

            <button
              onClick={() => {
                setIsInWaitingRoom(false);
                setGuestName("");
              }}
              style={{
                width: "100%",
                padding: "14px",
                background: "transparent",
                color: mutedColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 12,
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Andika', sans-serif",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    // Rejected from waiting room
    if (waitingRoomStatus?.rejected) {
      return (
        <div style={{
          minHeight: "100vh",
          background: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Andika', sans-serif",
        }}>
          <div style={{
            background: cardBg,
            borderRadius: 20,
            padding: 40,
            maxWidth: 420,
            width: "90%",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            border: `1px solid ${borderColor}`,
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF4757, #FF6B7A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <FaTimes style={{ fontSize: "1.8rem", color: "#fff" }} />
            </div>

            <h2 style={{ color: textColor, marginBottom: 8, fontSize: "1.5rem" }}>Entry Denied</h2>
            <p style={{ color: mutedColor, marginBottom: 24, fontSize: "0.9rem" }}>
              {waitingRoomStatus.reason || "The host has denied your request to join."}
            </p>

            <button
              onClick={() => {
                setWaitingRoomStatus(null);
                navigate("/dashboard");
              }}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #6759FF, #8B7FFF)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Andika', sans-serif",
              }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div style={{
        minHeight: "100vh",
        background: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Andika', sans-serif",
      }}>
        <div style={{
          background: cardBg,
          borderRadius: 20,
          padding: 40,
          maxWidth: 420,
          width: "90%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          border: `1px solid ${borderColor}`,
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "linear-gradient(135deg, #6759FF, #8B7FFF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <span style={{ color: "#fff", fontSize: "1.8rem", fontWeight: 700 }}>M</span>
          </div>

          <h2 style={{ color: textColor, marginBottom: 8, fontSize: "1.5rem" }}>Join Meeting</h2>
          <p style={{ color: mutedColor, marginBottom: 24, fontSize: "0.9rem" }}>
            {isLoggedIn ? `Welcome back, ${storedUser?.name || 'User'}! Click below to join.` : "Enter your name to join the meeting"}
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
                fontFamily: "'Andika', sans-serif",
              }}
            />
          )}

          <button
            onClick={handleJoin}
            disabled={!isLoggedIn && !guestName.trim()}
            style={{
              width: "100%",
              padding: "14px",
              background: (isLoggedIn || guestName.trim()) ? "linear-gradient(135deg, #6759FF, #8B7FFF)" : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: "1rem",
              fontWeight: 600,
              cursor: (isLoggedIn || guestName.trim()) ? "pointer" : "not-allowed",
              fontFamily: "'Andika', sans-serif",
            }}
          >
            {isLoggedIn ? "Join Meeting" : "Join Meeting"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: bgColor,
      paddingTop: 60,
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Andika', sans-serif",
    }}>
      <video ref={rawVideoRef} style={{ display: "none" }} autoPlay muted playsInline />

      {/* HEADER */}
      <header style={{
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
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}>
        {/* Left - Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
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
          }}>
            M
          </div>
          <div style={{ fontWeight: 600, color: textColor, fontSize: "1rem" }}>
            Meetify Meeting
          </div>
        </div>

        {/* Right - Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {waitingRoomUsers.length > 0 && (
            <button
              onClick={() => setRightPanel("waiting-room")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "linear-gradient(135deg, #FFA500, #FF6B35)",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: "0.85rem",
                color: "#fff",
                fontWeight: 600,
                fontFamily: "'Andika', sans-serif",
                animation: "pulse 2s infinite",
              }}
            >
              <FaUser style={{ fontSize: "0.9rem" }} />
              <span>{waitingRoomUsers.length} in Waiting Room</span>
            </button>
          )}

          <button
            onClick={() => setRightPanel("participants")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "linear-gradient(135deg, #6759FF, #8B7FFF)",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.85rem",
              color: "#fff",
              fontWeight: 600,
              fontFamily: "'Andika', sans-serif",
            }}
          >
            <FaUsers style={{ fontSize: "0.9rem" }} />
            <span>{participants.length}</span>
          </button>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            background: darkMode ? "#252540" : "#f5f5ff",
            borderRadius: 8,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6759FF, #8B7FFF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}>
              {guestName.charAt(0).toUpperCase()}
            </div>
            <span style={{ color: textColor, fontSize: "0.85rem", fontWeight: 500 }}>{guestName}</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div style={{
        flex: 1,
        display: "flex",
        marginTop: 60,
        overflow: "hidden",
      }}>
        {/* VIDEO SECTION */}
        <div style={{
          flex: 1,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflow: "auto",
        }}>
          {/* Video Container */}
          <div style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: participants.length === 1 ? "1fr" : (participants.length === 2 ? "1fr 1fr" : "repeat(auto-fit, minmax(300px, 1fr))"),
            gap: 16,
            alignItems: "center",
            justifyContent: "center",
          }}>
            {participants.map((participant) => (
              <div
                key={participant.id}
                onClick={participant.isLocal ? togglePin : undefined}
                style={{
                  background: "#000",
                  borderRadius: 16,
                  overflow: "hidden",
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16/9",
                  boxShadow: participant.isLocal && isPinned ? "0 0 0 3px #6759FF, 0 8px 32px rgba(103, 89, 255, 0.3)" : "0 8px 32px rgba(0,0,0,0.15)",
                  border: participant.isSpeaking && participant.isLocal && !isPinned ? `3px solid #4CAF50` : (participant.isLocal && isPinned ? `3px solid ${accentColor}` : "2px solid transparent"),
                  cursor: participant.isLocal ? "pointer" : "default",
                  transition: "all 0.3s ease",
                }}
              >
                {/* Screen Share - Full Screen (when sharing) */}
                {isScreenSharing && participant.isLocal && (
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      background: "#000",
                    }}
                  />
                )}

                {/* Camera Video */}
                {!isScreenSharing || !participant.isLocal ? (
                  participant.isLocal ? (
                    isCameraOn ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transform: "scaleX(-1)",
                        }}
                      />
                    ) : (
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                      }}>
                        <div style={{
                          width: 80,
                          height: 80,
                          borderRadius: "50%",
                          background: "rgba(103, 89, 255, 0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 12,
                        }}>
                          <FaUser style={{ fontSize: 36, color: "#6759FF" }} />
                        </div>
                        <span style={{ fontSize: "1.1rem", fontWeight: 500 }}>{participant.name}</span>
                      </div>
                    )
                  ) : (
                    // Remote participant video
                    participant.stream ? (
                      <video
                        ref={(videoEl) => {
                          if (videoEl && participant.stream) {
                            videoEl.srcObject = participant.stream;
                          }
                        }}
                        autoPlay
                        playsInline
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                      }}>
                        <div style={{
                          width: 80,
                          height: 80,
                          borderRadius: "50%",
                          background: "rgba(103, 89, 255, 0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 12,
                        }}>
                          <FaUser style={{ fontSize: 36, color: "#6759FF" }} />
                        </div>
                        <span style={{ fontSize: "1.1rem", fontWeight: 500 }}>{participant.name}</span>
                      </div>
                    )
                  )
                ) : null}

                {/* Screen Share Badge */}
                {isScreenSharing && participant.isLocal && (
                  <div style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    padding: "10px 16px",
                    background: "#FF4757",
                    borderRadius: 12,
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 12px rgba(255, 71, 87, 0.4)",
                    animation: "sharePulse 2s infinite",
                  }}>
                    <MdScreenShare style={{ fontSize: "1rem" }} />
                    <span>You are sharing your screen</span>
                  </div>
                )}

                {/* Pin Indicator */}
                {participant.isLocal && isPinned && (
                  <div style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    padding: "8px 12px",
                    background: "rgba(103, 89, 255, 0.95)",
                    borderRadius: 20,
                    color: "#fff",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}>
                    <FaThumbtack />
                    Pinned
                  </div>
                )}

                {/* Name Badge */}
                <div style={{
                  position: "absolute",
                  bottom: 16,
                  left: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <div style={{
                    padding: "8px 14px",
                    background: "rgba(0,0,0,0.75)",
                    borderRadius: 20,
                    color: "#fff",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    {participant.isLocal && (isMicOn ? (
                      <FaMicrophone style={{ fontSize: "0.85rem" }} />
                    ) : (
                      <FaMicrophoneSlash style={{ fontSize: "0.85rem", color: "#FF4757" }} />
                    ))}
                    <span>{participant.name}</span>
                  </div>
                </div>

                {/* Speaking Indicator */}
                {participant.isSpeaking && (
                  <div style={{
                    position: "absolute",
                    bottom: 16,
                    right: 16,
                    padding: "6px 12px",
                    background: "rgba(76, 175, 80, 0.9)",
                    borderRadius: 16,
                    color: "#fff",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}>
                    <FaCircle style={{ fontSize: "0.5rem", animation: "pulse 1s infinite" }} />
                    Speaking
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{
          width: 380,
          background: cardBg,
          borderLeft: `1px solid ${borderColor}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Panel Tabs */}
          <div style={{
            display: "flex",
            borderBottom: `1px solid ${borderColor}`,
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setRightPanel(tab.id)}
                style={{
                  flex: 1,
                  padding: "14px 8px",
                  background: rightPanel === tab.id ? accentColor : "transparent",
                  color: rightPanel === tab.id ? "#fff" : mutedColor,
                  border: "none",
                  borderBottom: rightPanel === tab.id ? `3px solid ${accentColor}` : "3px solid transparent",
                  cursor: "pointer",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "'Andika', sans-serif",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
            {/* AI Panel */}
            {rightPanel === "ai" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <button
                  onClick={generateAISummary}
                  disabled={aiLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "14px",
                    background: "linear-gradient(135deg, #6759FF, #8B7FFF)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    cursor: aiLoading ? "wait" : "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    fontFamily: "'Andika', sans-serif",
                  }}
                >
                  <FaRobot style={{ fontSize: "1.1rem" }} />
                  <span>{aiLoading ? "Processing..." : "Generate AI Summary"}</span>
                </button>

                <div style={{
                  padding: 16,
                  background: darkMode ? "#252540" : "#f8f8ff",
                  borderRadius: 12,
                  border: `1px solid ${borderColor}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <FaStickyNote style={{ color: accentColor }} />
                    <h4 style={{ margin: 0, color: textColor, fontSize: "0.95rem" }}>Meeting Summary</h4>
                  </div>
                  <p style={{ margin: 0, color: mutedColor, fontSize: "0.85rem", lineHeight: 1.6 }}>
                    {aiSummary}
                  </p>
                </div>

                <div style={{
                  padding: 16,
                  background: darkMode ? "#252540" : "#f8f8ff",
                  borderRadius: 12,
                  border: `1px solid ${borderColor}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <FaChevronRight style={{ color: accentColor }} />
                    <h4 style={{ margin: 0, color: textColor, fontSize: "0.95rem" }}>Action Items</h4>
                  </div>
                  {actionItems.length > 0 ? (
                    actionItems.map((item, idx) => (
                      <div key={idx} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 0",
                        borderBottom: `1px solid ${borderColor}`,
                      }}>
                        <FaCircle style={{ color: "#FF4757", fontSize: "0.6rem" }} />
                        <span style={{ flex: 1, color: textColor, fontSize: "0.85rem" }}>{item.task}</span>
                        <span style={{ fontSize: "0.75rem", color: mutedColor }}>{item.assignee}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: mutedColor, fontSize: "0.85rem" }}>No action items yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Chat Panel */}
            {rightPanel === "chat" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ flex: 1, overflow: "auto", marginBottom: 12 }}>
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} style={{
                      padding: "12px 14px",
                      background: msg.from === guestName
                        ? "linear-gradient(135deg, #6759FF, #8B7FFF)"
                        : (darkMode ? "#252540" : "#f8f8ff"),
                      color: msg.from === guestName ? "#fff" : textColor,
                      borderRadius: 12,
                      marginBottom: 8,
                      maxWidth: "85%",
                    }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: 4, opacity: 0.8 }}>
                        {msg.from} - {msg.time}
                      </div>
                      <div style={{ fontSize: "0.9rem" }}>{msg.text}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      border: `1px solid ${borderColor}`,
                      borderRadius: 20,
                      background: darkMode ? "#252540" : "#fff",
                      color: textColor,
                      fontSize: "0.85rem",
                      fontFamily: "'Andika', sans-serif",
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    style={{
                      width: 44,
                      height: 44,
                      background: accentColor,
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                    }}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}

            {/* Notes Panel */}
            {rightPanel === "notes" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Meeting notes will appear here..."
                  style={{
                    flex: 1,
                    width: "100%",
                    padding: 14,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 12,
                    background: darkMode ? "#252540" : "#fff",
                    color: textColor,
                    fontSize: "0.85rem",
                    resize: "none",
                    lineHeight: 1.6,
                    fontFamily: "'Andika', sans-serif",
                  }}
                />
                <button
                  onClick={() => {
                    const blob = new Blob([notes], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `meeting-notes-${Date.now()}.txt`;
                    a.click();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    padding: "12px",
                    background: "linear-gradient(135deg, #6759FF, #8B7FFF)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    fontFamily: "'Andika', sans-serif",
                  }}
                >
                  <FaDownload />
                  <span>Download Notes</span>
                </button>
              </div>
            )}

            {/* Participants Panel */}
            {rightPanel === "participants" && (
              <div>
                {participants.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: 40,
                    color: mutedColor,
                  }}>
                    <FaUser style={{ fontSize: "3rem", marginBottom: 12, opacity: 0.5 }} />
                    <p>No participants yet</p>
                  </div>
                ) : (
                  participants.map((p, idx) => (
                    <div key={idx} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 14,
                      background: darkMode ? "#252540" : "#f8f8ff",
                      borderRadius: 12,
                      marginBottom: 10,
                      border: `1px solid ${borderColor}`,
                    }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #6759FF, #8B7FFF)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                      }}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: textColor, fontSize: "0.95rem" }}>{p.name} {p.id === "you" && "(You)"}</div>
                        <div style={{ fontSize: "0.8rem", color: mutedColor, display: "flex", gap: 12, marginTop: 4 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {p.isMuted ? <FaMicrophoneSlash style={{ fontSize: "0.75rem", color: "#FF4757" }} /> : (p.isSpeaking ? <FaMicrophone style={{ fontSize: "0.75rem", color: "#4CAF50" }} /> : <FaMicrophone style={{ fontSize: "0.75rem", color: mutedColor }} />)}
                            {p.isMuted ? "Muted" : (p.isSpeaking ? "Speaking" : "Ready")}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {p.isVideoOn ? <FaVideo style={{ fontSize: "0.75rem", color: "#4CAF50" }} /> : <FaVideoSlash style={{ fontSize: "0.75rem", color: "#FF4757" }} />}
                            {p.isVideoOn ? "Video On" : "Video Off"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={togglePin}
                        style={{
                          padding: "8px",
                          background: isPinned ? accentColor : "transparent",
                          border: `1px solid ${borderColor}`,
                          borderRadius: 8,
                          cursor: "pointer",
                          color: isPinned ? "#fff" : mutedColor,
                        }}
                      >
                        <FaThumbtack style={{ fontSize: "0.9rem" }} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Waiting Room Panel */}
            {rightPanel === "waiting-room" && (
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}>
                  <h3 style={{ margin: 0, color: textColor, fontSize: "1rem" }}>Waiting Room</h3>
                  {waitingRoomUsers.length > 0 && (
                    <span style={{
                      padding: "4px 10px",
                      background: "linear-gradient(135deg, #FFA500, #FF6B35)",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}>
                      {waitingRoomUsers.length} pending
                    </span>
                  )}
                </div>
                
                {waitingRoomUsers.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: 40,
                    color: mutedColor,
                  }}>
                    <FaUser style={{ fontSize: "3rem", marginBottom: 12, opacity: 0.5 }} />
                    <p>No one is waiting to join</p>
                  </div>
                ) : (
                  waitingRoomUsers.map((user, idx) => (
                    <div key={idx} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 14,
                      background: darkMode ? "#252540" : "#f8f8ff",
                      borderRadius: 12,
                      marginBottom: 10,
                      border: `1px solid ${borderColor}`,
                    }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #FFA500, #FF6B35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                      }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: textColor, fontSize: "0.95rem" }}>{user.name}</div>
                        <div style={{ fontSize: "0.8rem", color: mutedColor, marginTop: 4 }}>
                          Waiting to join
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => rejectUser(user.name)}
                          style={{
                            padding: "8px 12px",
                            background: "transparent",
                            border: `1px solid ${borderColor}`,
                            borderRadius: 8,
                            cursor: "pointer",
                            color: "#FF4757",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <FaTimes style={{ fontSize: "0.8rem" }} />
                          Reject
                        </button>
                        <button
                          onClick={() => approveUser(user.name)}
                          style={{
                            padding: "8px 12px",
                            background: "linear-gradient(135deg, #4CAF50, #66BB6A)",
                            border: "none",
                            borderRadius: 8,
                            cursor: "pointer",
                            color: "#fff",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <FaCircle style={{ fontSize: "0.8rem" }} />
                          Accept
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div style={{
        background: cardBg,
        borderTop: `1px solid ${borderColor}`,
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        flexWrap: "wrap",
      }}>
        <button onClick={toggleMic} style={getCtrlBtnStyle(!isMicOn, "#FF4757")}>
          {isMicOn ? <FaMicrophone style={{ fontSize: "1.3rem" }} /> : <FaMicrophoneSlash style={{ fontSize: "1.3rem" }} />}
          <span>{isMicOn ? "Mute" : "Unmute"}</span>
        </button>

        <button onClick={toggleCamera} style={getCtrlBtnStyle(!isCameraOn, "#FF4757")}>
          {isCameraOn ? <FaVideo style={{ fontSize: "1.3rem" }} /> : <FaVideoSlash style={{ fontSize: "1.3rem" }} />}
          <span>{isCameraOn ? "Stop Video" : "Start Video"}</span>
        </button>

        <button onClick={isScreenSharing ? stopScreenShare : startScreenShare} style={getCtrlBtnStyle(isScreenSharing, "#6759FF")}>
          {isScreenSharing ? <MdStopScreenShare style={{ fontSize: "1.3rem" }} /> : <MdScreenShare style={{ fontSize: "1.3rem" }} />}
          <span>{isScreenSharing ? "Stop Share" : "Share Screen"}</span>
        </button>

        <button onClick={isRecording ? stopRecording : startRecording} style={getCtrlBtnStyle(isRecording, "#FF4757")}>
          {isRecording ? <FaStopCircle style={{ fontSize: "1.3rem" }} /> : <FaCircle style={{ fontSize: "1.3rem" }} />}
          <span>{isRecording ? "Stop Rec" : "Record"}</span>
        </button>

        <button
          onClick={leaveMeeting}
          style={{
            ...getCtrlBtnStyle(false, "#FF4757"),
            background: "linear-gradient(135deg, #FF4757, #FF6B7A)",
            marginLeft: 16,
          }}
        >
          <FaSignOutAlt style={{ fontSize: "1.3rem" }} />
          <span>Leave</span>
        </button>
      </div>

      {/* PIN MODAL */}
      {isPinModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setIsPinModalOpen(false)}
        >
          <div
            style={{
              background: cardBg,
              borderRadius: 20,
              padding: 32,
              maxWidth: 400,
              width: "90%",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              fontFamily: "'Andika', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6759FF, #8B7FFF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <FaLock style={{ fontSize: "1.5rem", color: "#fff" }} />
            </div>

            <h3 style={{ color: textColor, marginBottom: 8, fontSize: "1.2rem" }}>Meeting PIN</h3>
            <p style={{ color: mutedColor, fontSize: "0.9rem", marginBottom: 20 }}>
              Share this PIN with participants to join
            </p>

            <div style={{
              background: darkMode ? "#252540" : "#f8f8ff",
              padding: 24,
              borderRadius: 12,
              marginBottom: 20,
              border: `1px solid ${borderColor}`,
            }}>
              <div style={{
                fontSize: "2.8rem",
                fontWeight: "bold",
                color: accentColor,
                letterSpacing: "0.4rem",
                fontFamily: "monospace",
                textAlign: "center",
              }}>
                {meetingPin}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={copyPin}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "14px",
                  background: accentColor,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  fontFamily: "'Andika', sans-serif",
                }}
              >
                <FaCopy />
                <span>{pinCopied ? "Copied!" : "Copy PIN"}</span>
              </button>
              <button
                onClick={() => setIsPinModalOpen(false)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "14px",
                  background: "transparent",
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  fontFamily: "'Andika', sans-serif",
                }}
              >
                <FaTimes />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes sharePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4); }
          50% { transform: scale(1.02); box-shadow: 0 6px 20px rgba(255, 71, 87, 0.6); }
        }
      `}</style>
    </div>
  );
}
