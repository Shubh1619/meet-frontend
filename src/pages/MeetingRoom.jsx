import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaDoorOpen, FaUsers, FaHourglassHalf, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaRecordVinyl, FaClosedCaptioning, FaComment, FaSignOutAlt } from "react-icons/fa";
import ControlsBar from "./ControlsBar";
import ChatSidebar from "./ChatSidebar";
import RecordingModal from "./RecordingModal";
import VideoTile from "./VideoTile";
import useMeetingPermissions from "../hooks/useMeetingPermissions";
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
  const [myName, setMyName] = useState(initialStoredUser?.name || sessionStorage.getItem(`meeting-guest-name:${roomId}`) || "");
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [waitMessage, setWaitMessage] = useState("");
  const [participants, setParticipants] = useState([]);
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMirrored] = useState(true);

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const [recordingModalOpen, setRecordingModalOpen] = useState(false);
  const [recordingModalMode, setRecordingModalMode] = useState("start");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState("00:00");
  const [recordedBlobUrl, setRecordedBlobUrl] = useState("");

  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [captions, setCaptions] = useState({});
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const [toast, setToast] = useState("");

  const {
    permissionState,
    setRole,
    setPermissions,
    applyPermissionUpdate,
    canPrivateMessage,
    canGenerateAI,
    canUseCaptions,
    canScreenShare,
    canAdminControl,
  } = useMeetingPermissions(isLoggedIn ? "user" : "guest");

  // --- Media/WebRTC ---
  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pcsRef = useRef({});
  const iceQueueRef = useRef({});
  const wsRef = useRef(null);
  const myId = useRef(null);
  const hasJoinedRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const reconnectFnRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(null);

  // Check if device is mobile
  const isMobile = useRef(window.innerWidth <= 767);

  useEffect(() => {
    const handleResize = () => {
      isMobile.current = window.innerWidth <= 767;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    if (nav) {
      nav.style.display = "none";
      return () => {
        nav.style.display = "";
      };
    }
  }, []);

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
    setRole(isHostUser ? "host" : isLoggedIn ? "user" : "guest");
  }, [isHostUser, isLoggedIn, setRole]);

  useEffect(() => {
    const sourcePermissions = meetingInfo?.settings || meetingInfo?.meeting?.permissions || {};
    setPermissions({
      allow_user_ai: sourcePermissions.allow_user_ai,
      allow_user_captions: sourcePermissions.allow_user_captions,
      allow_guest_screen_share: sourcePermissions.allow_guest_screen_share,
      allow_user_screen_share: sourcePermissions.allow_user_screen_share,
    });
  }, [meetingInfo, setPermissions]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!meetingReady) return;

    if (hostSessionId) {
      setIsHostUser(true);
      setHostAccessResolved(true);
      return;
    }

    if (!isLoggedIn || !profileUser?.id || !meetingInfo?.host?.id) {
      setIsHostUser(false);
      setHostSessionId("");
      setHostAccessResolved(true);
      return;
    }

    let ignore = false;
    const matchesHost = String(profileUser.id) === String(meetingInfo.host.id);

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
  }, [isLoggedIn, profileUser?.id, meetingInfo?.host?.id, meetingReady, roomId, hostSessionId]);

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
            ? {
              ...p,
              name: displayName,
              stream,
              audioEnabled: stream.getAudioTracks()[0]?.enabled ?? true,
              videoEnabled: stream.getVideoTracks()[0]?.enabled ?? true,
            }
            : p
        ));
      } else {
        return [
          ...prev,
          {
            id: "you",
            name: displayName,
            stream,
            audioEnabled: stream.getAudioTracks()[0]?.enabled ?? true,
            videoEnabled: stream.getVideoTracks()[0]?.enabled ?? true,
            isLocal: true,
          },
        ];
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

  const toggleScreenShare = useCallback(async () => {
    if (!canScreenShare) {
      setToast("Feature disabled by host");
      return;
    }
    const localStream = localStreamRef.current;
    if (!localStream) return;

    if (!isScreenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        if (!screenTrack) return;

        screenStreamRef.current = displayStream;

        Object.values(pcsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });

        const audioTrack = localStream.getAudioTracks()[0];
        const previewStream = new MediaStream();
        if (audioTrack) previewStream.addTrack(audioTrack);
        previewStream.addTrack(screenTrack);
        setLocalStreamHandler(previewStream, myName);
        setIsScreenSharing(true);

        screenTrack.onended = () => {
          setIsScreenSharing((current) => {
            if (current) {
              const camTrack = cameraStreamRef.current?.getVideoTracks?.()[0];
              if (camTrack) {
                Object.values(pcsRef.current).forEach((pc) => {
                  const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
                  if (sender) sender.replaceTrack(camTrack);
                });

                const restoreAudioTrack = localStreamRef.current?.getAudioTracks?.()[0];
                const restoreStream = new MediaStream();
                if (restoreAudioTrack) restoreStream.addTrack(restoreAudioTrack);
                restoreStream.addTrack(camTrack);
                setLocalStreamHandler(restoreStream, myName);
              }
              if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((track) => track.stop());
                screenStreamRef.current = null;
              }
            }
            return false;
          });
        };
      } catch (error) {
        console.error("Screen share error:", error);
        alert("Unable to start screen sharing.");
      }
      return;
    }

    const camTrack = cameraStreamRef.current?.getVideoTracks?.()[0];
    if (!camTrack) return;

    Object.values(pcsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
      if (sender) sender.replaceTrack(camTrack);
    });

    const restoreAudioTrack = localStream.getAudioTracks()[0];
    const restoreStream = new MediaStream();
    if (restoreAudioTrack) restoreStream.addTrack(restoreAudioTrack);
    restoreStream.addTrack(camTrack);
    setLocalStreamHandler(restoreStream, myName);
    setIsScreenSharing(false);

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
  }, [canScreenShare, isScreenSharing, myName, setLocalStreamHandler]);

  useEffect(() => {
    if (!canScreenShare && isScreenSharing) {
      toggleScreenShare();
      setToast("Screen share was turned off by host");
    }
  }, [canScreenShare, isScreenSharing, toggleScreenShare]);

  useEffect(() => {
    if (!canUseCaptions && captionsEnabled) {
      setCaptionsEnabled(false);
      setToast("Captions were turned off by host");
    }
  }, [canUseCaptions, captionsEnabled]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setIsRecording(false);
        setRecordingTimer("00:00");

        const blob = new Blob(recordingChunksRef.current, { type: "video/webm" });
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setRecordedBlobUrl((prevUrl) => {
            if (prevUrl) URL.revokeObjectURL(prevUrl);
            return url;
          });
          setRecordingModalMode("saved");
          setRecordingModalOpen(true);
        }

        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach((track) => track.stop());
          recordingStreamRef.current = null;
        }
      };

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          const activeRecorder = mediaRecorderRef.current;
          if (activeRecorder && activeRecorder.state !== "inactive") {
            activeRecorder.stop();
          }
        };
      }

      recorder.start(1000);
      recordingStartedAtRef.current = Date.now();
      setIsRecording(true);
      setRecordingTimer("00:00");
      setRecordingModalOpen(false);
      setRecordingModalMode("start");
    } catch (error) {
      console.error("Unable to start recording:", error);
      alert("Recording did not start. Please choose what to record and confirm.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    setIsRecording(false);
    setRecordingTimer("00:00");
  }, []);

  const leaveMeeting = useCallback((shouldRedirect = true) => {
    hasJoinedRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "leave", id: myId.current }));
    }

    Object.values(pcsRef.current).forEach((pc) => pc.close());
    pcsRef.current = {};
    iceQueueRef.current = {};

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
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
    setUnreadChatCount(0);

    if (shouldRedirect) {
      if (isHostUser) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    }
  }, [isHostUser, navigate]);

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

        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        }
      ],
    });

    pc.onconnectionstatechange = () => {
      console.log("Connection:", remoteId, pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE:", remoteId, pc.iceConnectionState);
    };

    pcsRef.current[remoteId] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
    }

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      const nextAudioEnabled = typeof audioEnabled === "boolean"
        ? audioEnabled
        : (stream.getAudioTracks()[0]?.enabled ?? true);
      const nextVideoEnabled = typeof videoEnabled === "boolean"
        ? videoEnabled
        : (stream.getVideoTracks()[0]?.enabled ?? true);

      setParticipants((prev) => {
        const exists = prev.find((p) => p.id === remoteId);
        if (exists) {
          return prev.map((p) => (
            p.id === remoteId
              ? { ...p, stream, audioEnabled: nextAudioEnabled, videoEnabled: nextVideoEnabled }
              : p
          ));
        }

        return [
          ...prev,
          {
            id: remoteId,
            name: remoteName,
            stream,
            audioEnabled: nextAudioEnabled,
            videoEnabled: nextVideoEnabled,
          },
        ];
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
          token: hostMode ? (localStorage.getItem("token") || "") : "",
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
        case "permission_update":
          applyPermissionUpdate(msg);
          setToast("Meeting permissions updated");
          return;
        case "error":
          setToast(msg.message || "Permission denied");
          return;
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
          if (msg.id === myId.current) {
            if (msg.role) setRole(msg.role);
            return;
          }

          let pc = pcsRef.current[msg.id];
          if (!pc) {
            pc = createPeerConnection(msg.id, msg.name, msg.audioEnabled, msg.videoEnabled);
          }

          if (shouldInitiateConnection(msg.id)) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            wsRef.current?.send(JSON.stringify({
              type: "offer",
              sdp: offer.sdp,
              from: myId.current,
              to: msg.id,
              name: participantName,
            }));
          }
          return;

        case "waiting":
          setIsInWaitingRoom(true);
          setWaitMessage(msg.message || "Waiting for host approval...");
          return;

        case "approved":
          if (msg.role) setRole(msg.role);
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


        case "offer": {
          let offerPc = pcsRef.current[msg.from];
          if (!offerPc) {
            offerPc = createPeerConnection(msg.from, msg.name);
          }

          await offerPc.setRemoteDescription(new RTCSessionDescription(msg));

          if (iceQueueRef.current[msg.from]?.length) {
            for (const queuedCandidate of iceQueueRef.current[msg.from]) {
              await offerPc.addIceCandidate(new RTCIceCandidate(queuedCandidate));
            }
            iceQueueRef.current[msg.from] = [];
          }

          const answer = await offerPc.createAnswer();
          await offerPc.setLocalDescription(answer);

          wsRef.current?.send(JSON.stringify({
            type: "answer",
            sdp: answer.sdp,
            from: myId.current,
            to: msg.from,
          }));
          break;
        }
        case "answer": {
          let answerPc = pcsRef.current[msg.from];
          if (!answerPc) {
            answerPc = createPeerConnection(msg.from, msg.name, msg.audioEnabled, msg.videoEnabled);
          }

          await answerPc.setRemoteDescription(new RTCSessionDescription(msg));

          if (iceQueueRef.current[msg.from]?.length) {
            for (const queuedCandidate of iceQueueRef.current[msg.from]) {
              await answerPc.addIceCandidate(new RTCIceCandidate(queuedCandidate));
            }
            iceQueueRef.current[msg.from] = [];
          }
          break;
        }
        case "candidate": {
          const candidatePc = pcsRef.current[msg.from];
          if (!candidatePc) return;

          if (candidatePc.remoteDescription && candidatePc.remoteDescription.type) {
            await candidatePc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } else {
            if (!iceQueueRef.current[msg.from]) {
              iceQueueRef.current[msg.from] = [];
            }
            iceQueueRef.current[msg.from].push(msg.candidate);
          }
          break;
        }
        case "chat-message":
          setMessages((prev) => [...prev, { from: msg.name, text: msg.message, time: new Date().toLocaleTimeString(), own: false }]);
          setUnreadChatCount((count) => (chatOpen ? count : count + 1));
          break;
        case "private-message":
          setMessages((prev) => [...prev, { from: msg.name || "Private", text: msg.message, time: new Date().toLocaleTimeString(), own: false }]);
          setUnreadChatCount((count) => (chatOpen ? count : count + 1));
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
          delete iceQueueRef.current[msg.id];
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
  }, [applyPermissionUpdate, captionsEnabled, isRecording, createPeerConnection, shouldInitiateConnection, chatOpen, leaveMeeting, setRole]);

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
    const hostMode = Boolean(isHostUser);
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
    sessionStorage.setItem(`meeting-guest-name:${roomId}`, resolvedName);

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

  // ❌ REMOVE THIS BLOCK
  useEffect(() => {
    if (isLoggedIn) return;
    if (!roomId || !meetingReady || !hostAccessResolved) return;
    if (hasJoinedRef.current) return;

    const rememberedName = sessionStorage.getItem(`meeting-guest-name:${roomId}`) || myName;

    if (!rememberedName || rememberedName === "Guest") return;

    const timer = setTimeout(() => {
      joinCall(roomId, rememberedName);
    }, 0);

    return () => clearTimeout(timer);
  }, [isLoggedIn, roomId, meetingReady, hostAccessResolved, myName, joinCall]);

  useEffect(() => {
    return () => {
      hasJoinedRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      Object.values(pcsRef.current).forEach((pc) => pc.close());
      pcsRef.current = {};
      iceQueueRef.current = {};

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (chatOpen) {
      setUnreadChatCount(0);
    }
  }, [chatOpen]);

  useEffect(() => {
    return () => {
      if (recordedBlobUrl) {
        URL.revokeObjectURL(recordedBlobUrl);
      }
    };
  }, [recordedBlobUrl]);

  useEffect(() => {
    if (!isRecording) return undefined;

    const updateTimer = () => {
      const startedAt = recordingStartedAtRef.current || Date.now();
      const elapsedSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const minutes = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
      const seconds = String(elapsedSec % 60).padStart(2, "0");
      setRecordingTimer(`${minutes}:${seconds}`);
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [isRecording]);

  const approveGuest = (client_id) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "admit_user", target_client_id: client_id }));
      setWaitingUsers((prev) => prev.filter((u) => u.client_id !== client_id));
    }
  };

  const denyGuest = (client_id) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "deny_user", target_client_id: client_id }));
      setWaitingUsers((prev) => prev.filter((u) => u.client_id !== client_id));
    }
  };

  const sendHostAction = useCallback((type, target_client_id) => {
    if (!canAdminControl) {
      setToast("Host only action");
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, target_client_id }));
    }
  }, [canAdminControl]);

  const generateAISummary = useCallback(() => {
    if (!canGenerateAI) {
      setToast("Feature disabled by host");
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "generate_ai_summary", room_id: roomId }));
      setToast("AI summary request sent");
    }
  }, [canGenerateAI, roomId]);

  const togglePermissions = useCallback(async (nextPermissions) => {
    if (!canAdminControl) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/meeting/${roomId}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(nextPermissions),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data?.error || "Permission denied");
        return;
      }
      applyPermissionUpdate({ permissions: data.permissions });
      setToast("Permissions updated");
    } catch (error) {
      console.error("Permission update failed", error);
      setToast("Failed to update permissions");
    }
  }, [applyPermissionUpdate, canAdminControl, roomId]);

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

  const downloadRecording = useCallback(async () => {
    if (!recordedBlobUrl) return;
    const anchor = document.createElement("a");
    anchor.href = recordedBlobUrl;
    anchor.download = `meeting-recording-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
    anchor.click();
  }, [recordedBlobUrl]);

  const shareRecording = useCallback(async () => {
    if (!recordedBlobUrl) return;
    try {
      const response = await fetch(recordedBlobUrl);
      const blob = await response.blob();
      const file = new File([blob], "meeting-recording.webm", { type: "video/webm" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Meeting Recording",
          text: "Sharing my meeting recording",
          files: [file],
        });
      } else {
        await navigator.clipboard.writeText(recordedBlobUrl);
        alert("Share is not available on this device. Recording link copied.");
      }
    } catch (error) {
      console.error("Share failed:", error);
      alert("Unable to share recording right now.");
    }
  }, [recordedBlobUrl]);

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
            <h2>Join Meeting</h2>
            <p className="setup-subtitle">Enter your name to request access from the host.</p>
          </div>
          <input
            type="text"
            id="nameInput"
            placeholder="Enter your display name"
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
            Request to Join
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
        </div>

        {/* Waiting room requests (host only) */}
        {canAdminControl && waitingUsers.length > 0 && (
          <div className="waiting-room-notification">
            <div className="waiting-room-heading">
              <strong>New user requests waiting approval</strong>
              <span>{waitingUsers.length} pending</span>
            </div>
            {waitingUsers.map((user) => (
              <div key={user.client_id} className="waiting-room-row">
                <div>
                  <div className="waiting-user-name">{user.name || "Guest"}</div>
                  <div className="waiting-user-subtitle">Ready to join this meet</div>
                </div>
                <div className="waiting-room-actions">
                  <button className="approve-btn" onClick={() => approveGuest(user.client_id)}>Approve</button>
                  <button className="deny-btn" onClick={() => denyGuest(user.client_id)}>Deny</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {canAdminControl && (
          <div className="waiting-room-notification" style={{ marginTop: 12 }}>
            <div className="waiting-room-heading">
              <strong>Host Permission Controls</strong>
            </div>
            <div className="waiting-room-actions">
              <button
                className="approve-btn"
                onClick={() => togglePermissions({ allow_user_ai: !permissionState.permissions.allow_user_ai })}
              >
                User AI: {permissionState.permissions.allow_user_ai ? "ON" : "OFF"}
              </button>
              <button
                className="approve-btn"
                onClick={() => togglePermissions({ allow_user_captions: !permissionState.permissions.allow_user_captions })}
              >
                User Captions: {permissionState.permissions.allow_user_captions ? "ON" : "OFF"}
              </button>
              <button
                className="approve-btn"
                onClick={() =>
                  togglePermissions({
                    allow_user_screen_share: !permissionState.permissions.allow_user_screen_share,
                  })
                }
              >
                User Share: {permissionState.permissions.allow_user_screen_share ? "ON" : "OFF"}
              </button>
              <button
                className="approve-btn"
                onClick={() =>
                  togglePermissions({
                    allow_guest_screen_share: !permissionState.permissions.allow_guest_screen_share,
                  })
                }
              >
                Guest Share: {permissionState.permissions.allow_guest_screen_share ? "ON" : "OFF"}
              </button>
            </div>
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

        {canAdminControl && participants.filter((p) => p.id !== "you").length > 0 && (
          <div className="waiting-room-notification" style={{ marginTop: 12 }}>
            <div className="waiting-room-heading">
              <strong>Participant Admin Controls</strong>
            </div>
            {participants
              .filter((p) => p.id !== "you")
              .map((p) => (
                <div key={`admin-${p.id}`} className="waiting-room-row">
                  <div>
                    <div className="waiting-user-name">{p.name || "Participant"}</div>
                    <div className="waiting-user-subtitle">{p.id}</div>
                  </div>
                  <div className="waiting-room-actions">
                    <button className="approve-btn" onClick={() => sendHostAction("mute_user", p.id)}>Mute</button>
                    <button className="approve-btn" onClick={() => sendHostAction("disable_camera", p.id)}>Cam Off</button>
                    <button className="deny-btn" onClick={() => sendHostAction("kick_user", p.id)}>Kick</button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Controls */}
        <ControlsBar
          isMicOn={localParticipant?.audioEnabled ?? true}
          isCameraOn={localParticipant?.videoEnabled ?? true}
          isSharingScreen={isScreenSharing}
          isRecording={isRecording}
          captionsEnabled={captionsEnabled}
          chatOpen={chatOpen}
          unreadChatCount={unreadChatCount}
          onToggleMic={() => toggleMic()}
          onToggleCamera={() => toggleCamera()}
          onShareScreen={() => toggleScreenShare()}
          onRecord={() => {
            if (!canAdminControl) {
              setToast("Host only action");
              return;
            }
            if (isRecording) {
              stopRecording();
              return;
            }
            setRecordingModalMode("start");
            setRecordingModalOpen(true);
          }}
          onCaptions={() => {
            if (!canUseCaptions) {
              setToast("Feature disabled by host");
              return;
            }
            setCaptionsEnabled(!captionsEnabled);
          }}
          onGenerateAI={() => generateAISummary()}
          onChat={() => setChatOpen(!chatOpen)}
          onLeave={() => leaveMeeting()}
          canShareScreen={canScreenShare}
          canCaptions={canUseCaptions}
          canRecord={canAdminControl}
          canGenerateAI={canGenerateAI}
          canAdminControl={canAdminControl}
        />

        {/* Chat Sidebar */}
        <ChatSidebar
          isOpen={chatOpen}
          messages={messages}
          onClose={() => setChatOpen(false)}
          msgInput={msgInput}
          setMsgInput={setMsgInput}
          sendMessage={() => sendChatMessage(msgInput)}
          canPrivateMessage={canPrivateMessage}
        />

        {toast && (
          <div className="meeting-state-card" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, padding: "10px 14px" }}>
            <p style={{ margin: 0 }}>{toast}</p>
          </div>
        )}

        {/* Recording Modal */}
        <RecordingModal
          isOpen={recordingModalOpen}
          onClose={() => setRecordingModalOpen(false)}
          mode={recordingModalMode}
          onStartRecording={startRecording}
          onDownload={downloadRecording}
          onShare={shareRecording}
        />
      </div>
    );
  }

  return null;
}
