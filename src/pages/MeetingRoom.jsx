import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaUsers, FaHourglassHalf, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaRecordVinyl, FaClosedCaptioning, FaComment, FaSignOutAlt, FaChevronUp, FaChevronDown } from "react-icons/fa";
import ControlsBar from "./ControlsBar";
import ChatSidebar from "./ChatSidebar";
import RecordingModal from "./RecordingModal";
import VideoTile from "./VideoTile";
import useMeetingPermissions from "../hooks/useMeetingPermissions";
import { API_BASE } from "../api";
import { useToast } from "../components/ToastProvider";
import "./MeetingRoom.css";

export default function MeetingRoom() {
  // --- State ---
  const { roomId } = useParams();
  const navigate = useNavigate();
  const initialStoredUser = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const [setupVisible, setSetupVisible] = useState(true);
  const [roomVisible, setRoomVisible] = useState(false);
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

  const [activePanel, setActivePanel] = useState(null);
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
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 767);
  const [supportsScreenShare, setSupportsScreenShare] = useState(true);
  const [supportsRecording, setSupportsRecording] = useState(true);
  const [participantPage, setParticipantPage] = useState(0);
  const [previewStream, setPreviewStream] = useState(null);
  const [previewMicOn, setPreviewMicOn] = useState(false);
  const [previewCamOn, setPreviewCamOn] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const cancelLeaveBtnRef = useRef(null);
  const previewVideoRef = useRef(null);
  const relayWarningShownRef = useRef(false);
  const toast = useToast();
  const isChatPanelOpen = activePanel === "chat";
  const [pipPosition, setPipPosition] = useState({ x: 0, y: 0 });
  const [pipReady, setPipReady] = useState(false);
  const pipDragRef = useRef({
    active: false,
    pointerId: null,
    offsetX: 0,
    offsetY: 0,
  });
  const waitingRequestToastRef = useRef(new Set());
  const backgroundPipVideoRef = useRef(null);

  const buildIceServers = useCallback(() => {
    const envTurn = (import.meta.env.VITE_TURN_URLS || "").trim();
    const envTurnUser = (import.meta.env.VITE_TURN_USERNAME || "").trim();
    const envTurnCredential = (import.meta.env.VITE_TURN_CREDENTIAL || "").trim();

    const servers = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" },
    ];

    if (envTurn && envTurnUser && envTurnCredential) {
      servers.push({
        urls: envTurn.split(",").map((u) => u.trim()).filter(Boolean),
        username: envTurnUser,
        credential: envTurnCredential,
      });
    } else {
      servers.push({
        urls: [
          "turn:openrelay.metered.ca:80?transport=udp",
          "turn:openrelay.metered.ca:80?transport=tcp",
          "turn:openrelay.metered.ca:443?transport=tcp",
          "turns:openrelay.metered.ca:443?transport=tcp",
        ],
        username: "openrelayproject",
        credential: "openrelayproject",
      });
    }

    return servers;
  }, []);

  const getIceTransportPolicy = useCallback(() => {
    const raw = (import.meta.env.VITE_ICE_TRANSPORT_POLICY || "").trim().toLowerCase();
    if (raw === "relay") return "relay";
    return "all";
  }, []);

  const resolveWsBaseUrl = useCallback(() => {
    const rawWs = (import.meta.env.VITE_WS_URL || "").trim();
    const rawApiEnv = (import.meta.env.VITE_API_URL || "").trim();
    const rawApi = (API_BASE || rawApiEnv || "").trim();

    if (rawWs) {
      if (rawWs.startsWith("ws://") || rawWs.startsWith("wss://")) {
        return rawWs.replace(/\/+$/, "");
      }
      if (rawWs.startsWith("http://")) {
        return rawWs.replace("http://", "ws://").replace(/\/+$/, "");
      }
      if (rawWs.startsWith("https://")) {
        return rawWs.replace("https://", "wss://").replace(/\/+$/, "");
      }
    }

    if (rawApi) {
      if (rawApi.startsWith("http://")) {
        return rawApi.replace("http://", "ws://").replace(/\/+$/, "");
      }
      if (rawApi.startsWith("https://")) {
        return rawApi.replace("https://", "wss://").replace(/\/+$/, "");
      }
    }

    if (typeof window !== "undefined") {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${window.location.host}`;
    }

    return "";
  }, []);

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

  const profileAvatarUrl = (() => {
    const rawAvatar = profileUser?.avatar_url || profileUser?.profile_image || profileUser?.avatar || "";
    if (!rawAvatar || typeof rawAvatar !== "string") return "";
    if (rawAvatar.startsWith("data:")) return "";
    return rawAvatar;
  })();

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
  const remoteStreamsRef = useRef({});
  const hostActionCooldownRef = useRef({});
  const autoReconnectAttemptedRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 767);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canUseDisplayMedia = Boolean(navigator?.mediaDevices?.getDisplayMedia);
    const canUseMediaRecorder = typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined";
    setSupportsScreenShare(canUseDisplayMedia);
    setSupportsRecording(canUseDisplayMedia && canUseMediaRecorder);
  }, []);

  useEffect(() => {
    if (!setupVisible || !meetingReady || !hostAccessResolved || meetingLoadError) return;

    let cancelled = false;

    async function setupPreview() {
      if (cameraStreamRef.current) {
        const existingStream = cameraStreamRef.current;
        setPreviewStream(existingStream);
        setPreviewMicOn(existingStream.getAudioTracks()[0]?.enabled ?? false);
        setPreviewCamOn(existingStream.getVideoTracks()[0]?.enabled ?? false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) return;
        cameraStreamRef.current = stream;
        setPreviewStream(stream);
        setPreviewMicOn(stream.getAudioTracks()[0]?.enabled ?? false);
        setPreviewCamOn(stream.getVideoTracks()[0]?.enabled ?? false);
      } catch (error) {
        if (cancelled) return;
        console.warn("Preview media unavailable. Continuing without media.", error);
        const fallbackStream = new MediaStream();
        cameraStreamRef.current = fallbackStream;
        setPreviewStream(fallbackStream);
        setPreviewMicOn(false);
        setPreviewCamOn(false);
      }
    }

    setupPreview();
    return () => {
      cancelled = true;
    };
  }, [setupVisible, meetingReady, hostAccessResolved, meetingLoadError]);

  useEffect(() => {
    if (!setupVisible || !previewVideoRef.current) return;
    if (!previewStream) return;
    previewVideoRef.current.srcObject = previewStream;
    previewVideoRef.current.play().catch(() => {});
  }, [setupVisible, previewStream]);

  const togglePreviewTrack = useCallback(async (kind) => {
    const stream = cameraStreamRef.current;
    if (!stream) return;
    const track = kind === "audio" ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
    if (kind === "audio") {
      if (!track) return;
      track.enabled = !track.enabled;
      setPreviewMicOn(track.enabled);
      return;
    }
    if (track) {
      track.stop();
      stream.removeTrack(track);
      setPreviewCamOn(false);
      sessionStorage.setItem("cameraOff", "true");
      return;
    }

    try {
      const videoOnlyStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const nextTrack = videoOnlyStream.getVideoTracks()[0];
      if (!nextTrack) return;
      stream.addTrack(nextTrack);
      setPreviewCamOn(true);
      sessionStorage.setItem("cameraOff", "false");
    } catch (error) {
      console.warn("Unable to re-enable preview camera.", error);
      toast.warning("Camera permission denied. Please allow access to turn video on.");
    }
  }, [toast]);

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
    autoReconnectAttemptedRef.current = false;
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
        const response = await fetch(`${API_BASE}/auth/user`, {
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
        const response = await fetch(`${API_BASE}/meeting/${roomId}`);
        if (!response.ok) {
          throw new Error("Unable to load meeting info");
        }

        const data = await response.json();
        if (ignore) return;

        setMeetingInfo(data);
        setMeetingLoadError("");
      } catch (error) {
        if (!ignore) {
          console.error("Failed to load meeting info:", error);
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
        const response = await fetch(`${API_BASE}/auth/host-session`, {
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
              avatarUrl: p.avatarUrl || profileUser?.avatar_url || profileUser?.profile_image || null,
              stream,
              audioEnabled: stream.getAudioTracks()[0]?.enabled ?? false,
              videoEnabled: stream.getVideoTracks()[0]?.enabled ?? false,
            }
            : p
        ));
      } else {
        return [
          ...prev,
          {
            id: "you",
            name: displayName,
            avatarUrl: profileUser?.avatar_url || profileUser?.profile_image || null,
            stream,
            audioEnabled: stream.getAudioTracks()[0]?.enabled ?? false,
            videoEnabled: stream.getVideoTracks()[0]?.enabled ?? false,
            isLocal: true,
          },
        ];
      }
    });
  }, [myName, profileUser?.avatar_url, profileUser?.profile_image]);

  const upsertParticipantPresence = useCallback((participant) => {
    if (!participant?.id || participant.id === myId.current) return;
    setParticipants((prev) => {
      const existing = prev.find((p) => p.id === participant.id);
      const safeName = (participant.name || "").trim() || existing?.name || "Guest";
      if (existing) {
        return prev.map((p) => (
          p.id === participant.id
            ? {
              ...p,
              name: safeName,
              audioEnabled: typeof participant.audioEnabled === "boolean" ? participant.audioEnabled : p.audioEnabled,
              videoEnabled: typeof participant.videoEnabled === "boolean" ? participant.videoEnabled : p.videoEnabled,
              avatarUrl: participant.avatarUrl ?? p.avatarUrl ?? null,
              role: participant.role || p.role,
            }
            : p
        ));
      }

      return [
        ...prev,
        {
          id: participant.id,
          name: safeName,
          stream: null,
          audioEnabled: typeof participant.audioEnabled === "boolean" ? participant.audioEnabled : false,
          videoEnabled: typeof participant.videoEnabled === "boolean" ? participant.videoEnabled : false,
          avatarUrl: participant.avatarUrl ?? null,
          role: participant.role || "guest",
        },
      ];
    });
  }, []);

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
        name: myName || profileUser?.name || "Guest",
        audioEnabled: stream.getAudioTracks()[0]?.enabled ?? false,
        videoEnabled: stream.getVideoTracks()[0]?.enabled ?? false,
        avatar_url: profileAvatarUrl || undefined,
      }));
    }
  }, [myName, profileAvatarUrl, profileUser?.name]);

  const syncVideoTrackForPeers = useCallback((videoTrack) => {
    Object.values(pcsRef.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        sender.replaceTrack(videoTrack || null).catch((error) => {
          console.warn("Failed to update outgoing video track:", error);
        });
        return;
      }

      if (videoTrack && localStreamRef.current) {
        try {
          pc.addTrack(videoTrack, localStreamRef.current);
        } catch (error) {
          console.warn("Failed to add outgoing video track:", error);
        }
      }
    });
  }, []);

  const disableLocalCameraCapture = useCallback(() => {
    const cameraStream = cameraStreamRef.current;
    const cameraVideoTracks = cameraStream?.getVideoTracks?.() || [];
    const stoppedVideoTrackIds = new Set(cameraVideoTracks.map((track) => track.id));

    cameraVideoTracks.forEach((track) => {
      track.stop();
      cameraStream.removeTrack(track);
    });

    if (localStreamRef.current && stoppedVideoTrackIds.size > 0) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        if (stoppedVideoTrackIds.has(track.id)) {
          localStreamRef.current.removeTrack(track);
        }
      });
    }

    if (!isScreenSharing) {
      syncVideoTrackForPeers(null);
      setParticipants((prev) =>
        prev.map((p) => (p.id === "you" ? { ...p, videoEnabled: false } : p))
      );
    }

    sessionStorage.setItem("cameraOff", "true");
    sendStateUpdate();
  }, [isScreenSharing, sendStateUpdate, syncVideoTrackForPeers]);

  const enableLocalCameraCapture = useCallback(async () => {
    const currentCameraTrack = cameraStreamRef.current?.getVideoTracks?.()[0];
    if (currentCameraTrack) {
      currentCameraTrack.enabled = true;
      setParticipants((prev) =>
        prev.map((p) => (p.id === "you" ? { ...p, videoEnabled: true } : p))
      );
      sessionStorage.setItem("cameraOff", "false");
      sendStateUpdate();
      return true;
    }

    try {
      const videoOnlyStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const nextVideoTrack = videoOnlyStream.getVideoTracks()[0];
      if (!nextVideoTrack) return false;

      if (!cameraStreamRef.current) {
        cameraStreamRef.current = new MediaStream();
      }
      cameraStreamRef.current.addTrack(nextVideoTrack);

      if (localStreamRef.current) {
        localStreamRef.current.addTrack(nextVideoTrack);
      } else {
        const baseStream = new MediaStream();
        const audioTrack = cameraStreamRef.current.getAudioTracks()[0];
        if (audioTrack) baseStream.addTrack(audioTrack);
        baseStream.addTrack(nextVideoTrack);
        localStreamRef.current = baseStream;
      }

      if (!isScreenSharing) {
        syncVideoTrackForPeers(nextVideoTrack);
        setLocalStreamHandler(localStreamRef.current, myName || profileUser?.name || "Guest");
      }
      sessionStorage.setItem("cameraOff", "false");
      sendStateUpdate();
      return true;
    } catch (error) {
      console.warn("Camera permission denied or unavailable while enabling camera.", error);
      return false;
    }
  }, [isScreenSharing, myName, profileUser?.name, sendStateUpdate, setLocalStreamHandler, syncVideoTrackForPeers]);

  const applyForcedLocalState = useCallback((actionType) => {
    const stream = localStreamRef.current;
    if (!stream) return;

    if (actionType === "mute_user") {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack && audioTrack.enabled) {
        audioTrack.enabled = false;
        sessionStorage.setItem("micMuted", "true");
        setParticipants((prev) => prev.map((p) => (p.id === "you" ? { ...p, audioEnabled: false } : p)));
        sendStateUpdate();
        toast.info("Your microphone was muted by the host.");
      }
      return;
    }

    if (actionType === "disable_camera") {
      const hasLiveCameraTrack = (cameraStreamRef.current?.getVideoTracks?.() || []).some(
        (track) => track.readyState === "live"
      );
      if (hasLiveCameraTrack) {
        disableLocalCameraCapture();
        toast.info("Your camera was turned off by the host.");
      }
    }
  }, [disableLocalCameraCapture, toast]);

  function toggleMic() {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setParticipants((prev) =>
      prev.map((p) => (p.id === "you" ? { ...p, audioEnabled: track.enabled } : p))
    );
    sessionStorage.setItem("micMuted", String(!track.enabled));
    sendStateUpdate();
  }

  async function toggleCamera() {
    const stream = localStreamRef.current;
    if (!stream) return;

    const hasLiveVideoTrack = (cameraStreamRef.current?.getVideoTracks?.() || []).some(
      (track) => track.readyState === "live"
    );
    if (hasLiveVideoTrack) {
      disableLocalCameraCapture();
      toast.info("Camera is fully turned off.");
      return;
    }

    const enabled = await enableLocalCameraCapture();
    if (!enabled) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === "you" ? { ...p, videoEnabled: false } : p))
      );
      sessionStorage.setItem("cameraOff", "true");
      sendStateUpdate();
      toast.warning("Camera access denied. Please allow permission to turn it back on.");
      return;
    }

  }

  const toggleScreenShare = useCallback(async () => {
    if (!supportsScreenShare) {
      toast.warning("Screen sharing is not supported on this browser/device.");
      return;
    }
    if (!canScreenShare) {
      toast.warning("Feature disabled by host.");
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
        toast.error("Unable to start screen sharing.");
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
  }, [supportsScreenShare, canScreenShare, isScreenSharing, myName, setLocalStreamHandler, toast]);

  useEffect(() => {
    if (!canScreenShare && isScreenSharing) {
      toggleScreenShare();
      toast.info("Screen share was turned off by host.");
    }
  }, [canScreenShare, isScreenSharing, toggleScreenShare]);

  useEffect(() => {
    if (!canUseCaptions && captionsEnabled) {
      setCaptionsEnabled(false);
      toast.info("Captions were turned off by host.");
    }
  }, [canUseCaptions, captionsEnabled]);

  const startRecording = useCallback(async () => {
    if (!supportsRecording) {
      toast.warning("Recording is not supported on this browser/device.");
      return;
    }
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
      toast.warning("Recording did not start. Please choose what to record and confirm.");
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

  const stopAllMediaTracks = useCallback(() => {
    const streams = [
      localStreamRef.current,
      cameraStreamRef.current,
      screenStreamRef.current,
      recordingStreamRef.current,
    ].filter(Boolean);

    const stoppedTracks = new Set();
    streams.forEach((stream) => {
      stream.getTracks().forEach((track) => {
        if (!stoppedTracks.has(track.id)) {
          track.stop();
          stoppedTracks.add(track.id);
        }
      });
    });
  }, []);

  const leaveMeeting = useCallback((shouldRedirect = true, hostLeaveMode = "end_all") => {
    hasJoinedRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (isHostUser) {
        wsRef.current.send(JSON.stringify({ type: "host-leave-mode", mode: hostLeaveMode }));
      }
      wsRef.current.send(JSON.stringify({ type: "leave", id: myId.current }));
    }

    Object.values(pcsRef.current).forEach((pc) => pc.close());
    pcsRef.current = {};
    iceQueueRef.current = {};
    remoteStreamsRef.current = {};

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    stopAllMediaTracks();
    cameraStreamRef.current = null;
    screenStreamRef.current = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    recordingStreamRef.current = null;

    localStreamRef.current = null;
    setActivePanel(null);
    setMessages([]);
    setMsgInput("");
    setRoomVisible(false);
    setSetupVisible(true);
    setPreviewStream(null);
    setPreviewMicOn(false);
    setPreviewCamOn(false);
    setParticipants([]);
    setPinnedParticipantId(null);
    setIsInWaitingRoom(false);
    setUnreadChatCount(0);
    setLeaveConfirmOpen(false);
    sessionStorage.removeItem(`meeting-active:${roomId}`);

    if (shouldRedirect) {
      const targetPath = isLoggedIn ? "/dashboard" : "/login";
      navigate(targetPath, { replace: true });
      window.setTimeout(() => {
        if (window.location.pathname !== targetPath) {
          window.location.assign(targetPath);
          return;
        }
        window.location.reload();
      }, 40);
    }
  }, [isHostUser, isLoggedIn, navigate, roomId, stopAllMediaTracks]);

  const handleLeaveAction = useCallback(() => {
    if (!isHostUser) {
      leaveMeeting();
      return;
    }
    setLeaveConfirmOpen(true);
  }, [isHostUser, leaveMeeting]);

  const confirmHostLeaveForAll = useCallback(() => {
    setLeaveConfirmOpen(false);
    leaveMeeting(true, "end_all");
  }, [leaveMeeting]);

  const confirmHostLeaveOnly = useCallback(() => {
    setLeaveConfirmOpen(false);
    leaveMeeting(true, "leave_only");
  }, [leaveMeeting]);

  const cancelHostLeave = useCallback(() => {
    setLeaveConfirmOpen(false);
  }, [supportsRecording, toast]);

  useEffect(() => {
    if (!leaveConfirmOpen) return;
    const focusTimeout = window.setTimeout(() => {
      cancelLeaveBtnRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(focusTimeout);
  }, [leaveConfirmOpen]);

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
      iceServers: buildIceServers(),
      iceCandidatePoolSize: 10,
      iceTransportPolicy: getIceTransportPolicy(),
    });

    let iceRestartTimeout = null;
    const clearIceRestartTimeout = () => {
      if (iceRestartTimeout) {
        window.clearTimeout(iceRestartTimeout);
        iceRestartTimeout = null;
      }
    };

    const scheduleIceRestart = () => {
      clearIceRestartTimeout();
      iceRestartTimeout = window.setTimeout(async () => {
        if (!pcsRef.current[remoteId]) return;
        if (pc.connectionState === "connected") return;
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        try {
          console.warn("[WebRTC] ICE stuck. Restarting ICE for", remoteId);
          const offer = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(offer);
          wsRef.current.send(JSON.stringify({
            type: "offer",
            sdp: offer.sdp,
            from: myId.current,
            to: remoteId,
            name: myName || "Guest",
            audioEnabled: localStreamRef.current?.getAudioTracks?.()[0]?.enabled ?? false,
            videoEnabled: localStreamRef.current?.getVideoTracks?.()[0]?.enabled ?? false,
          }));
        } catch (error) {
          console.error("[WebRTC] ICE restart failed:", error);
        }
      }, 12000);
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection:", remoteId, pc.connectionState);
      if (pc.connectionState === "connected") {
        clearIceRestartTimeout();
      } else if (pc.connectionState === "failed") {
        if (!relayWarningShownRef.current) {
          relayWarningShownRef.current = true;
          toast.warning("Network relay failed. Configure a working TURN server for reliable video.");
        }
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        scheduleIceRestart();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE:", remoteId, pc.iceConnectionState);
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        clearIceRestartTimeout();
      } else if (pc.iceConnectionState === "checking") {
        scheduleIceRestart();
      } else if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
        scheduleIceRestart();
      }
    };

    pcsRef.current[remoteId] = pc;

    const localTracks = localStreamRef.current?.getTracks?.() || [];
    if (localTracks.length > 0) {
      console.debug("[WebRTC] adding local tracks to peer", remoteId, localTracks.map((t) => t.kind));
      localTracks.forEach((track) => pc.addTrack(track, localStreamRef.current));
    } else {
      // Allow media-less users to still receive remote audio/video.
      pc.addTransceiver("audio", { direction: "recvonly" });
      pc.addTransceiver("video", { direction: "recvonly" });
      console.debug("[WebRTC] no local tracks. Added recvonly transceivers for", remoteId);
    }

    pc.ontrack = (e) => {
      const incomingStream = e.streams?.[0];
      let stream = incomingStream;
      if (!stream) {
        if (!remoteStreamsRef.current[remoteId]) {
          remoteStreamsRef.current[remoteId] = new MediaStream();
        }
        stream = remoteStreamsRef.current[remoteId];
      } else {
        remoteStreamsRef.current[remoteId] = incomingStream;
      }

      if (e.track && !stream.getTracks().some((track) => track.id === e.track.id)) {
        stream.addTrack(e.track);
      }

      const videoTrackCount = stream.getVideoTracks().length;
      const audioTrackCount = stream.getAudioTracks().length;
      const nextAudioEnabled = typeof audioEnabled === "boolean"
        ? audioEnabled
        : (audioTrackCount > 0 ? (stream.getAudioTracks()[0]?.enabled ?? true) : false);
      const nextVideoEnabled = typeof videoEnabled === "boolean"
        ? videoEnabled
        : (videoTrackCount > 0 ? true : false);

      console.debug("[WebRTC:ontrack]", {
        from: remoteId,
        kind: e.track?.kind,
        streamId: stream.id,
        audioTrackCount,
        videoTrackCount,
        nextAudioEnabled,
        nextVideoEnabled,
      });

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
        console.debug("[WebRTC] sending ICE candidate", { to: remoteId, from: myId.current });
        wsRef.current.send(JSON.stringify({ type: "candidate", candidate: e.candidate, from: myId.current, to: remoteId }));
      }
    };

    pc.onicecandidateerror = (event) => {
      console.warn("[WebRTC] ICE candidate error", {
        remoteId,
        address: event.address,
        url: event.url,
        errorCode: event.errorCode,
        errorText: event.errorText,
      });
    };

    return pc;
  }, [buildIceServers, myName, getIceTransportPolicy, toast]);

  // --- WebSocket ---
  const connectWebSocket = useCallback((room, participantName, hostMode, sessionId = "") => {
    const wsBase = resolveWsBaseUrl();
    const wsUrl = `${wsBase}/ws/${room}`;

    if (!wsBase) {
      toast.error("Unable to connect: WebSocket server URL is not configured.");
      return;
    }

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      if (hostMode) {
        setRole("host");
      }
      const joinType = hostMode ? "host-join" : "waiting-room-request";
      socket.send(
        JSON.stringify({
          type: joinType,
          from: myId.current,
          name: participantName,
          session_id: sessionId,
          token: hostMode ? (localStorage.getItem("token") || "") : "",
          audioEnabled: localStreamRef.current?.getAudioTracks()[0]?.enabled ?? false,
          videoEnabled: localStreamRef.current?.getVideoTracks()[0]?.enabled ?? false,
          avatar_url: profileAvatarUrl || undefined,
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
          toast.info("Meeting permissions updated.");
          return;
        case "error":
          toast.error(msg.message || "Permission denied");
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
        case "waiting-list":
          setWaitingUsers(
            Array.isArray(msg.users)
              ? msg.users.map((user) => ({
                client_id: user.client_id,
                name: user.name || "Guest",
              }))
              : []
          );
          return;
        case "waiting-room-updated":
          if (typeof msg.count === "number" && msg.count === 0) {
            setWaitingUsers([]);
          }
          return;

        case "user-joined":
          if (msg.id === myId.current) {
            if (msg.role) setRole(msg.role);
            return;
          }

          upsertParticipantPresence({
            id: msg.id,
            name: msg.name,
            role: msg.role,
            audioEnabled: msg.audioEnabled,
            videoEnabled: msg.videoEnabled,
            avatarUrl: msg.avatar_url || msg.avatarUrl || null,
          });

          let pc = pcsRef.current[msg.id];
          if (!pc) {
            pc = createPeerConnection(msg.id, msg.name, msg.audioEnabled, msg.videoEnabled);
          }

          if (shouldInitiateConnection(msg.id)) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.debug("[WebRTC] sending offer", { to: msg.id, from: myId.current });

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
          setRoomVisible(false);
          setWaitMessage(msg.message || "Waiting for host approval...");
          return;
        case "joined":
          if (msg.role) setRole(msg.role);
          setIsInWaitingRoom(false);
          setRoomVisible(true);
          setWaitMessage("");
          return;

        case "approved":
          if (msg.role) setRole(msg.role);
          setIsInWaitingRoom(false);
          setRoomVisible(true);
          setWaitMessage("");
          return;

        case "denied":
          toast.error(msg.message || "Your entry was denied by the host.");
          setIsInWaitingRoom(false);
          setSetupVisible(true);
          setRoomVisible(false);
          setWaitMessage("");
          return;

        case "update-state":
          upsertParticipantPresence({
            id: msg.id,
            name: msg.name,
            audioEnabled: msg.audioEnabled,
            videoEnabled: msg.videoEnabled,
            avatarUrl: msg.avatar_url || msg.avatarUrl || null,
          });
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === msg.id
                ? { ...p, audioEnabled: msg.audioEnabled, videoEnabled: msg.videoEnabled }
                : p
            )
          );
          return;
        case "mute_user":
        case "disable_camera": {
          const targetId = msg.target_client_id;
          if (!targetId) return;

          if (targetId === myId.current) {
            applyForcedLocalState(msg.type);
          }

          setParticipants((prev) =>
            prev.map((p) => {
              if (p.id !== targetId) return p;
              if (msg.type === "mute_user") return { ...p, audioEnabled: false };
              return { ...p, videoEnabled: false };
            })
          );
          return;
        }


        case "offer": {
          console.debug("[WebRTC] received offer", { from: msg.from, to: myId.current });
          let offerPc = pcsRef.current[msg.from];
          if (!offerPc) {
            offerPc = createPeerConnection(msg.from, msg.name);
          }
          upsertParticipantPresence({
            id: msg.from,
            name: msg.name,
            audioEnabled: msg.audioEnabled,
            videoEnabled: msg.videoEnabled,
            avatarUrl: msg.avatar_url || msg.avatarUrl || null,
          });

          await offerPc.setRemoteDescription(new RTCSessionDescription(msg));

          if (iceQueueRef.current[msg.from]?.length) {
            for (const queuedCandidate of iceQueueRef.current[msg.from]) {
              await offerPc.addIceCandidate(new RTCIceCandidate(queuedCandidate));
            }
            iceQueueRef.current[msg.from] = [];
          }

          const answer = await offerPc.createAnswer();
          await offerPc.setLocalDescription(answer);
          console.debug("[WebRTC] sending answer", { to: msg.from, from: myId.current });

          wsRef.current?.send(JSON.stringify({
            type: "answer",
            sdp: answer.sdp,
            from: myId.current,
            to: msg.from,
          }));
          break;
        }
        case "answer": {
          console.debug("[WebRTC] received answer", { from: msg.from, to: myId.current });
          let answerPc = pcsRef.current[msg.from];
          if (!answerPc) {
            answerPc = createPeerConnection(msg.from, msg.name, msg.audioEnabled, msg.videoEnabled);
          }
          upsertParticipantPresence({
            id: msg.from,
            name: msg.name,
            audioEnabled: msg.audioEnabled,
            videoEnabled: msg.videoEnabled,
            avatarUrl: msg.avatar_url || msg.avatarUrl || null,
          });

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
          console.debug("[WebRTC] received ICE candidate", { from: msg.from, to: myId.current });
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
          setUnreadChatCount((count) => (isChatPanelOpen ? count : count + 1));
          break;
        case "private-message":
          setMessages((prev) => [...prev, { from: msg.name || "Private", text: msg.message, time: new Date().toLocaleTimeString(), own: false }]);
          setUnreadChatCount((count) => (isChatPanelOpen ? count : count + 1));
          break;
        case "waiting-user-left":
          setWaitingUsers((prev) => prev.filter((user) => user.client_id !== msg.client_id));
          break;
        case "removed":
          toast.error(msg.message || "You were removed from the meeting.");
          leaveMeeting();
          return;
        case "host-left":
          toast.warning(msg.message || "The host has left the meeting.");
          leaveMeeting();
          return;
        case "host-left-continue":
          toast.info(msg.message || "Host left. Meeting continues.");
          return;
        case "host-transferred":
          if (msg.host_id === myId.current) {
            setRole("host");
            setIsHostUser(true);
            toast.success(msg.message || "You are now the host.");
          } else {
            toast.info(msg.message || "Host role transferred.");
          }
          return;
        case "user-left":
          if (pcsRef.current[msg.id]) {
            pcsRef.current[msg.id].close();
            delete pcsRef.current[msg.id];
          }
          delete iceQueueRef.current[msg.id];
          delete remoteStreamsRef.current[msg.id];
          setParticipants((prev) => prev.filter((p) => p.id !== msg.id));
          setPinnedParticipantId((prev) => (prev === msg.id ? null : prev));
          break;
      }
    };

    socket.onerror = () => {
      toast.error("Realtime connection failed. Please refresh and try again.");
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
  }, [applyForcedLocalState, applyPermissionUpdate, captionsEnabled, isRecording, createPeerConnection, shouldInitiateConnection, isChatPanelOpen, leaveMeeting, setRole, upsertParticipantPresence, profileAvatarUrl, resolveWsBaseUrl, toast]);

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

    const response = await fetch(`${API_BASE}/guest/session`, {
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
    setPreviewStream(null);

    if (hostMode) {
      setRoomVisible(true);
      setIsInWaitingRoom(false);
      console.log("Host auto join, using profile identity:", resolvedName);
    } else {
      setRoomVisible(false);
      setIsInWaitingRoom(true);
      setWaitMessage("Waiting for host approval...");
    }

    sessionStorage.setItem("room", room);
    sessionStorage.setItem("name", resolvedName);
    sessionStorage.setItem(`meeting-guest-name:${roomId}`, resolvedName);

    try {
      if (!hostMode && !sessionId) {
        sessionId = await ensureGuestSession(resolvedName);
      }

      const savedMic = sessionStorage.getItem("micMuted") === "true";
      const savedCam = sessionStorage.getItem("cameraOff") === "true";
      let stream = cameraStreamRef.current;
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: !savedCam, audio: true });
        } catch (mediaError) {
          console.warn("Media unavailable. Joining without camera/microphone.", mediaError);
          stream = new MediaStream();
          toast.info("Joined without camera/microphone.");
        }
      }

      cameraStreamRef.current = stream;
      if (stream.getAudioTracks()[0] && savedMic) stream.getAudioTracks()[0].enabled = false;
      if (savedCam) {
        stream.getVideoTracks().forEach((track) => {
          track.stop();
          stream.removeTrack(track);
        });
      }
      sessionStorage.setItem("micMuted", String(!(stream.getAudioTracks()[0]?.enabled ?? false)));
      sessionStorage.setItem("cameraOff", String(!(stream.getVideoTracks()[0]?.enabled ?? false)));

      setLocalStreamHandler(stream, resolvedName);
      if (stream.getAudioTracks().length > 0) {
        monitorAudioLevel(stream, "localVideoContainer");
      }

      sessionStorage.setItem(`meeting-active:${room}`, "true");
    } catch (e) {
      hasJoinedRef.current = false;
      console.error("Join error", e);
      toast.error("Could not join meeting. Please try again.");
      return;
    }

    connectWebSocket(room, resolvedName, hostMode, sessionId);
  }, [roomId, isLoggedIn, profileUser?.name, myName, connectWebSocket, setLocalStreamHandler, isHostUser, hostSessionId, guestSessionId, ensureGuestSession]);

  useEffect(() => {
    if (!roomId || autoReconnectAttemptedRef.current) return;
    if (!setupVisible || roomVisible || isInWaitingRoom) return;
    if (!meetingReady || !hostAccessResolved || (isLoggedIn && !profileReady)) return;
    if (sessionStorage.getItem(`meeting-active:${roomId}`) !== "true") return;

    autoReconnectAttemptedRef.current = true;
    const savedName =
      sessionStorage.getItem("name") ||
      sessionStorage.getItem(`meeting-guest-name:${roomId}`) ||
      myName ||
      profileUser?.name ||
      "Guest";

    joinCall(roomId, savedName);
  }, [
    roomId,
    setupVisible,
    roomVisible,
    isInWaitingRoom,
    meetingReady,
    hostAccessResolved,
    isLoggedIn,
    profileReady,
    myName,
    profileUser?.name,
    joinCall,
  ]);

  // ❌ REMOVE THIS BLOCK
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

      stopAllMediaTracks();
      cameraStreamRef.current = null;
      screenStreamRef.current = null;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      recordingStreamRef.current = null;
    };
  }, [stopAllMediaTracks]);

  useEffect(() => {
    if (isChatPanelOpen) {
      setUnreadChatCount(0);
    }
  }, [isChatPanelOpen]);

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

  const canForceMediaOff = useCallback((actionType, targetClientId) => {
    const targetParticipant = participants.find((p) => p.id === targetClientId);
    if (!targetParticipant) return false;

    if (actionType === "mute_user") return Boolean(targetParticipant.audioEnabled);
    if (actionType === "disable_camera") return Boolean(targetParticipant.videoEnabled);
    return true;
  }, [participants]);

  const sendHostAction = useCallback((type, target_client_id) => {
    if (!canAdminControl) {
      toast.warning("Host-only action.");
      return;
    }
    if (!target_client_id || target_client_id === "you" || target_client_id === myId.current) {
      if (type === "kick_user") {
        toast.warning("Host cannot remove themselves.");
      }
      return;
    }

    if ((type === "mute_user" || type === "disable_camera") && !canForceMediaOff(type, target_client_id)) {
      return;
    }

    const throttleKey = `${type}:${target_client_id}`;
    const now = Date.now();
    const nextAllowedAt = hostActionCooldownRef.current[throttleKey] || 0;
    if (now < nextAllowedAt) return;

    if (type === "kick_user") {
      const targetName = participants.find((p) => p.id === target_client_id)?.name || "this participant";
      const shouldRemove = window.confirm(`Remove ${targetName} from the meeting?`);
      if (!shouldRemove) return;
    }

    hostActionCooldownRef.current[throttleKey] = now + 800;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, target_client_id }));
      if (type === "mute_user") {
        setParticipants((prev) => prev.map((p) => (p.id === target_client_id ? { ...p, audioEnabled: false } : p)));
        toast.success("User muted");
      } else if (type === "disable_camera") {
        setParticipants((prev) => prev.map((p) => (p.id === target_client_id ? { ...p, videoEnabled: false } : p)));
        toast.success("Camera turned off");
      } else if (type === "kick_user") {
        toast.success("Participant removed");
      }
    }
  }, [canAdminControl, canForceMediaOff, participants, toast]);

  const generateAISummary = useCallback(() => {
    if (!canGenerateAI) {
      toast.warning("Feature disabled by host.");
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "generate_ai_summary", room_id: roomId }));
      toast.success("AI summary request sent.");
    }
  }, [canGenerateAI, roomId]);

  const togglePermissions = useCallback(async (nextPermissions) => {
    if (!canAdminControl) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/meeting/${roomId}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(nextPermissions),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Permission denied");
        return;
      }
      applyPermissionUpdate({ permissions: data.permissions });
      toast.success("Permissions updated.");
    } catch (error) {
      console.error("Permission update failed", error);
      toast.error("Failed to update permissions.");
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
  const mobilePanelOpen = isMobileView && Boolean(activePanel);
  const pipParticipant =
    (pinnedParticipantId && participants.find((participant) => participant.id === pinnedParticipantId)) ||
    localParticipant ||
    participants[0] ||
    null;
  const shouldShowMobilePip = mobilePanelOpen && Boolean(pipParticipant);
  const participantsPerPage = 8;
  const totalParticipantPages = Math.max(1, Math.ceil(participants.length / participantsPerPage));
  const pagedParticipants = participants.slice(
    participantPage * participantsPerPage,
    participantPage * participantsPerPage + participantsPerPage
  );
  const activeGridParticipants = pinnedParticipantId ? participants : pagedParticipants;
  const waitingCount = waitingUsers.length;
  const canManageWaitingRoom = canAdminControl || isHostUser;

  const togglePanel = useCallback((panelName) => {
    setActivePanel((current) => (current === panelName ? null : panelName));
  }, []);

  const getPipSize = useCallback(() => {
    const width = Math.min(220, Math.max(148, Math.floor(window.innerWidth * 0.38)));
    const height = Math.floor((width * 9) / 16);
    return { width, height };
  }, []);

  const clampPipPosition = useCallback((rawX, rawY) => {
    const { width, height } = getPipSize();
    const margin = 10;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const maxY = Math.max(margin, window.innerHeight - height - margin);
    return {
      x: Math.min(Math.max(rawX, margin), maxX),
      y: Math.min(Math.max(rawY, margin), maxY),
    };
  }, [getPipSize]);

  useEffect(() => {
    if (!shouldShowMobilePip) {
      setPipReady(false);
      return;
    }
    const { width, height } = getPipSize();
    const margin = 12;
    const initialX = window.innerWidth - width - margin;
    const initialY = window.innerHeight - height - 106;
    setPipPosition(clampPipPosition(initialX, initialY));
    setPipReady(true);
  }, [shouldShowMobilePip, getPipSize, clampPipPosition, activePanel]);

  useEffect(() => {
    if (!shouldShowMobilePip) return;
    const handleWindowResize = () => {
      setPipPosition((prev) => clampPipPosition(prev.x, prev.y));
    };
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [shouldShowMobilePip, clampPipPosition]);

  const onPipPointerDown = useCallback((event) => {
    if (!shouldShowMobilePip) return;
    const targetRect = event.currentTarget.getBoundingClientRect();
    pipDragRef.current.active = true;
    pipDragRef.current.pointerId = event.pointerId;
    pipDragRef.current.offsetX = event.clientX - targetRect.left;
    pipDragRef.current.offsetY = event.clientY - targetRect.top;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, [shouldShowMobilePip]);

  const onPipPointerMove = useCallback((event) => {
    if (!pipDragRef.current.active || pipDragRef.current.pointerId !== event.pointerId) return;
    const nextX = event.clientX - pipDragRef.current.offsetX;
    const nextY = event.clientY - pipDragRef.current.offsetY;
    setPipPosition(clampPipPosition(nextX, nextY));
  }, [clampPipPosition]);

  const endPipDrag = useCallback((event) => {
    if (pipDragRef.current.pointerId !== event.pointerId) return;
    pipDragRef.current.active = false;
    pipDragRef.current.pointerId = null;
  }, []);

  useEffect(() => {
    if (!canManageWaitingRoom || waitingUsers.length === 0) return;
    const latest = waitingUsers[waitingUsers.length - 1];
    if (!latest?.client_id || waitingRequestToastRef.current.has(latest.client_id)) return;

    waitingRequestToastRef.current.add(latest.client_id);
    toast.info(`${latest.name || "A participant"} requested to join.`, { duration: 2600 });
  }, [waitingUsers, canManageWaitingRoom, toast]);

  useEffect(() => {
    if (!roomVisible || !pipParticipant?.stream || !backgroundPipVideoRef.current) return;
    const pipVideo = backgroundPipVideoRef.current;
    pipVideo.srcObject = pipParticipant.stream;
    pipVideo.play().catch(() => {});
  }, [roomVisible, pipParticipant]);

  useEffect(() => {
    if (!roomVisible || !backgroundPipVideoRef.current) return;

    const handleVisibilityChange = async () => {
      const pipVideo = backgroundPipVideoRef.current;
      if (!pipVideo) return;

      if (document.hidden) {
        if (!document.pictureInPictureEnabled || !pipParticipant?.stream) return;
        if (document.pictureInPictureElement) return;
        try {
          await pipVideo.play();
          await pipVideo.requestPictureInPicture();
        } catch {
          // Best effort only: browser/device support differs.
        }
        return;
      }

      if (document.pictureInPictureElement === pipVideo) {
        try {
          await document.exitPictureInPicture();
        } catch {
          // ignore
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [roomVisible, pipParticipant]);

  useEffect(() => {
    if (!roomVisible) return;

    const handleBackgroundState = () => {
      if (document.hidden) {
        disableLocalCameraCapture();
      }
    };

    document.addEventListener("visibilitychange", handleBackgroundState);
    window.addEventListener("pagehide", handleBackgroundState);

    return () => {
      document.removeEventListener("visibilitychange", handleBackgroundState);
      window.removeEventListener("pagehide", handleBackgroundState);
    };
  }, [disableLocalCameraCapture, roomVisible]);

  const attendeeList = participants
    .map((participant) => ({
      ...participant,
      displayName: (participant.name || (participant.id === "you" ? myName : "Guest") || "Guest").trim(),
      isSelf: participant.id === "you" || participant.id === myId.current,
    }))
    .sort((a, b) => {
      if (a.id === "you") return -1;
      if (b.id === "you") return 1;
      return a.displayName.localeCompare(b.displayName);
    })
    .map((participant, index) => ({
      ...participant,
      serial: index + 1,
    }));

  useEffect(() => {
    setParticipantPage((prev) => Math.min(prev, Math.max(0, totalParticipantPages - 1)));
  }, [totalParticipantPages]);

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
        toast.info("Share is not available on this device. Recording link copied.");
      }
    } catch (error) {
      console.error("Share failed:", error);
      toast.error("Unable to share recording right now.");
    }
  }, [recordedBlobUrl]);

  // --- Render ---
  if ((isLoggedIn && !profileReady) || !meetingReady || !hostAccessResolved) {
    return (
      <div className="meeting-room-shell meeting-room-shell--entry">
        <div className="meeting-state-card">
          <h2>Loading your meeting profile</h2>
          <p>Checking room access and syncing the correct host identity before joining.</p>
        </div>
      </div>
    );
  }

  if (meetingLoadError) {
    return (
      <div className="meeting-room-shell meeting-room-shell--entry">
        <div className="meeting-state-card">
          <h2>Meeting unavailable</h2>
          <p>{meetingLoadError}</p>
        </div>
      </div>
    );
  }

  if (setupVisible) {
    const displayName = (isLoggedIn ? profileUser?.name : myName)?.trim() || "Guest";
    const displayInitials = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "G";
    const setupAvatarUrl = profileAvatarUrl || (typeof localStorage !== "undefined" ? localStorage.getItem("profile_avatar_data_url") || "" : "");

    return (
      <div id="setup" className="meeting-room-shell meeting-room-shell--entry meeting-room-shell--setup">
        <div className="setup-container meeting-state-card setup-join-card">
          <div className="setup-header">
            <h2>Join Meeting</h2>
            <p className="setup-subtitle">Preview your camera and audio before joining.</p>
          </div>
          <div className="setup-preview-grid">
            <div className="setup-preview-tile">
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className={`setup-preview-video ${isMirrored ? "video-tile-video-mirrored" : ""}`}
              />
              {!previewCamOn && (
                <div className="setup-preview-overlay">
                  <div className="setup-preview-avatar">
                    {setupAvatarUrl ? (
                      <img src={setupAvatarUrl} alt={displayName} className="setup-preview-avatar-image" />
                    ) : (
                      <span className="setup-preview-avatar-initials">{displayInitials}</span>
                    )}
                  </div>
                  <div className="setup-preview-camera-off">
                    <FaVideoSlash />
                    <span>Camera Off</span>
                  </div>
                </div>
              )}
              <div className="setup-preview-footer">
                <span className="setup-preview-name">{displayName}</span>
                <span className="setup-preview-status">
                  {previewMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
                  {previewCamOn ? <FaVideo /> : <FaVideoSlash />}
                </span>
              </div>
            </div>
          </div>
          {!isLoggedIn && (
            <div className="setup-name-input-wrapper">
              <label htmlFor="nameInput" className="setup-name-label">Enter Your Name</label>
              <input
                type="text"
                id="nameInput"
                className="setup-name-input"
                placeholder="Enter your name"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
              />
            </div>
          )}
          <div className="setup-controls" role="group" aria-label="Preview controls">
            <button
              type="button"
              className={`setup-control-btn ${previewMicOn ? "is-on" : "is-off"}`}
              onClick={() => togglePreviewTrack("audio")}
            >
              {previewMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
              <span>{previewMicOn ? "Mic On" : "Mic Off"}</span>
            </button>
            <button
              type="button"
              className={`setup-control-btn ${previewCamOn ? "is-on" : "is-off"}`}
              onClick={() => togglePreviewTrack("video")}
            >
              {previewCamOn ? <FaVideo /> : <FaVideoSlash />}
              <span>{previewCamOn ? "Camera On" : "Camera Off"}</span>
            </button>
          </div>
          <button
            id="joinBtn"
            className="setup-join-button"
            onClick={() => {
              const trimmedName = (myName || "").trim();
              if (!isLoggedIn && !trimmedName) {
                toast.warning("Please enter your name to continue.");
                return;
              }
              joinCall(roomId || "default-room", trimmedName || profileUser?.name || "Guest");
            }}
          >
            {isHostUser ? "Join Meeting" : "Request to Join"}
          </button>
        </div>
      </div>
    );
  }

  if (isInWaitingRoom) {
    return (
      <div className="meeting-room-shell meeting-room-shell--entry">
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
          <div className="room-brand">
            <div className="room-brand-logo">M</div>
            <div className="room-brand-name">Meeting Platform</div>
          </div>
          <div className="room-info">
            <button
              type="button"
              className="participant-circle-btn"
              onClick={() => togglePanel("attendees")}
              aria-label="Open attendee list"
            >
              <FaUsers />
              <span>{participants.length}</span>
              {canManageWaitingRoom && waitingCount > 0 && (
                <span className="join-request-badge">{waitingCount}</span>
              )}
            </button>
            {canManageWaitingRoom && waitingCount > 0 && (
              <div className="room-pill waiting-pill">
                <FaHourglassHalf />
                <span>{waitingCount} waiting</span>
              </div>
            )}
            {isLoggedIn && !isMobileView && (
              <button
                type="button"
                className="room-pill room-action-pill room-desktop-only"
                onClick={() => generateAISummary()}
              >
                AI Summary
              </button>
            )}
            {isLoggedIn && !isMobileView && (
              <button
                type="button"
                className="room-pill room-action-pill room-desktop-only"
                onClick={() => {
                  if (isRecording) {
                    stopRecording();
                    return;
                  }
                  setRecordingModalMode("start");
                  setRecordingModalOpen(true);
                }}
              >
                {isRecording ? "Stop Recording" : "Record"}
              </button>
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
        {canManageWaitingRoom && waitingUsers.length > 0 && (
          <div className="waiting-room-notification">
            <div className="waiting-room-heading">
              <strong>New user requests waiting approval</strong>
              <span>{waitingUsers.length} pending</span>
            </div>
            <div className="waiting-room-actions">
              <button
                className="approve-btn"
                onClick={() => setActivePanel("attendees")}
              >
                Open Waiting List
              </button>
            </div>
          </div>
        )}

        <div className={`meeting-layout${activePanel ? " has-panel-open" : ""}${mobilePanelOpen ? " mobile-panel-open" : ""}`}>
          <div className="meeting-stage">
            {/* Main Content */}
            <div id="main-content" className={pinnedParticipantId ? "pin-active" : ""}>
              <div id="videos" className={`participant-grid participants-${Math.min(activeGridParticipants.length || 1, 8)}`}>
                {activeGridParticipants
                  .filter((p) => !pinnedParticipantId || p.id === pinnedParticipantId)
                  .map((p) => (
                    <VideoTile
                      key={p.id}
                      {...p}
                      captions={captions[p.id]}
                      isPinned={p.id === pinnedParticipantId}
                      isFeatured={p.id === pinnedParticipantId}
                      isMirrored={p.isLocal ? isMirrored : false}
                      onTogglePin={() => setPinnedParticipantId((current) => (current === p.id ? null : p.id))}
                    />
                  ))}
              </div>
              {!pinnedParticipantId && totalParticipantPages > 1 && (
                <div className="participant-page-nav" aria-label="Participant pages">
                  <button
                    type="button"
                    className="participant-page-btn"
                    onClick={() => setParticipantPage((prev) => Math.max(0, prev - 1))}
                    disabled={participantPage === 0}
                    aria-label="Previous participant page"
                    title="Previous participants"
                  >
                    <FaChevronUp />
                  </button>
                  <span className="participant-page-indicator">
                    {participantPage + 1} / {totalParticipantPages}
                  </span>
                  <button
                    type="button"
                    className="participant-page-btn"
                    onClick={() => setParticipantPage((prev) => Math.min(totalParticipantPages - 1, prev + 1))}
                    disabled={participantPage >= totalParticipantPages - 1}
                    aria-label="Next participant page"
                    title="Next participants"
                  >
                    <FaChevronDown />
                  </button>
                </div>
              )}
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
                      onTogglePin={() => setPinnedParticipantId((current) => (current === p.id ? null : p.id))}
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
                      onTogglePin={() => setPinnedParticipantId((current) => (current === p.id ? null : p.id))}
                    />
                  ))}
            </div>
          </div>

          {activePanel && (
            <aside className="meeting-side-panel" aria-label={isChatPanelOpen ? "Chat panel" : "Attendee list panel"}>
              {isChatPanelOpen ? (
                <ChatSidebar
                  isOpen
                  embedded
                  messages={messages}
                  onClose={() => setActivePanel(null)}
                  msgInput={msgInput}
                  setMsgInput={setMsgInput}
                  sendMessage={() => sendChatMessage(msgInput)}
                  canPrivateMessage={canPrivateMessage}
                />
              ) : (
                <aside className="participants-sidebar participants-sidebar--docked" aria-label="Attendee list sidebar">
                  <div className="participants-sidebar-header">
                    <div>
                      <h3>Attendees</h3>
                      <p>{attendeeList.length} in meet</p>
                    </div>
                    <button
                      type="button"
                      className="participants-sidebar-close"
                      onClick={() => setActivePanel(null)}
                      aria-label="Close attendee list"
                    >
                      X
                    </button>
                  </div>
                  <div className="participants-section">
                    <div className="participants-section-title">In Meet ({attendeeList.length})</div>
                  </div>
                  <div className="participants-sidebar-list">
                    {attendeeList.map((participant) => (
                      <div key={`attendee-${participant.id}`} className="participants-sidebar-item">
                        <div className="participants-avatar">
                          {participant.avatarUrl ? (
                            <img src={participant.avatarUrl} alt={participant.displayName} className="participants-avatar-image" />
                          ) : (
                            participant.displayName.slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <div className="participants-meta">
                          <div className="participants-name">
                            {participant.displayName}
                            {participant.id === "you" ? " (You)" : ""}
                            {participant.role === "host" ? " (Host)" : ""}
                          </div>
                          <div className="participants-status">
                            {participant.audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
                            {participant.videoEnabled ? <FaVideo /> : <FaVideoSlash />}
                          </div>
                        </div>
                        {canAdminControl && !participant.isSelf && (
                          <div className="participants-actions" role="group" aria-label={`Host controls for ${participant.displayName}`}>
                            <button
                              type="button"
                              className="participant-action-btn"
                              onClick={() => sendHostAction("mute_user", participant.id)}
                              disabled={!participant.audioEnabled}
                              title={participant.audioEnabled ? "Mute participant" : "Participant microphone is already off"}
                              aria-label={`Mute ${participant.displayName}`}
                            >
                              <FaMicrophoneSlash />
                            </button>
                            <button
                              type="button"
                              className="participant-action-btn"
                              onClick={() => sendHostAction("disable_camera", participant.id)}
                              disabled={!participant.videoEnabled}
                              title={participant.videoEnabled ? "Turn camera off" : "Participant camera is already off"}
                              aria-label={`Turn off camera for ${participant.displayName}`}
                            >
                              <FaVideoSlash />
                            </button>
                            <button
                              type="button"
                              className="participant-action-btn participant-action-btn-danger"
                              onClick={() => sendHostAction("kick_user", participant.id)}
                              title="Remove participant"
                              aria-label={`Remove ${participant.displayName}`}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {canManageWaitingRoom && (
                    <div className="participants-sidebar-footer">
                      <div className="participants-section-title">Waiting ({waitingUsers.length})</div>
                      {waitingUsers.length === 0 && (
                        <div className="participants-waiting-empty">No join requests pending.</div>
                      )}
                      {waitingUsers.length > 0 && (
                        <div className="participants-waiting-list">
                          {waitingUsers.map((user) => (
                            <div key={`waiting-${user.client_id}`} className="participants-waiting-item">
                              <div>
                                <div className="waiting-user-name">{user.name || "Guest"}</div>
                                <div className="waiting-user-subtitle">Requested to join</div>
                              </div>
                              <div className="waiting-room-actions">
                                <button className="approve-btn" onClick={() => approveGuest(user.client_id)}>Approve</button>
                                <button className="deny-btn" onClick={() => denyGuest(user.client_id)}>Deny</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </aside>
              )}
            </aside>
          )}
        </div>

        {shouldShowMobilePip && pipReady && (
          <div
            className="mobile-pip-window"
            style={{ left: `${pipPosition.x}px`, top: `${pipPosition.y}px` }}
            onPointerDown={onPipPointerDown}
            onPointerMove={onPipPointerMove}
            onPointerUp={endPipDrag}
            onPointerCancel={endPipDrag}
          >
            <VideoTile
              key={`pip-${pipParticipant.id}`}
              {...pipParticipant}
              captions={captions[pipParticipant.id]}
              isPinned={false}
              isMirrored={pipParticipant.isLocal ? isMirrored : false}
              onTogglePin={() => {}}
            />
          </div>
        )}

        <video
          ref={backgroundPipVideoRef}
          playsInline
          autoPlay
          style={{ display: "none" }}
        />

        {/* Controls */}
        <ControlsBar
          isMicOn={localParticipant?.audioEnabled ?? true}
          isCameraOn={localParticipant?.videoEnabled ?? true}
          isSharingScreen={isScreenSharing}
          isRecording={isRecording}
          captionsEnabled={captionsEnabled}
          chatOpen={isChatPanelOpen}
          unreadChatCount={unreadChatCount}
          onToggleMic={() => toggleMic()}
          onToggleCamera={() => toggleCamera()}
          onShareScreen={() => toggleScreenShare()}
          onRecord={() => {
            if (!isLoggedIn) {
              toast.warning("Login required.");
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
              toast.warning("Feature disabled by host.");
              return;
            }
            setCaptionsEnabled(!captionsEnabled);
          }}
          onGenerateAI={() => generateAISummary()}
          onChat={() => togglePanel("chat")}
          onLeave={() => handleLeaveAction()}
          canShareScreen={canScreenShare && supportsScreenShare}
          canCaptions={isLoggedIn && canUseCaptions}
          canRecord={isLoggedIn && isMobileView && supportsRecording}
          canGenerateAI={isLoggedIn && isMobileView}
          canAdminControl={canAdminControl}
          mobileIconsOnly={isMobileView}
        />

        {/* Recording Modal */}
        <RecordingModal
          isOpen={recordingModalOpen}
          onClose={() => setRecordingModalOpen(false)}
          mode={recordingModalMode}
          onStartRecording={startRecording}
          onDownload={downloadRecording}
          onShare={shareRecording}
        />

        {leaveConfirmOpen && (
          <div className="modal-backdrop">
            <div className="recording-modal leave-modal">
              <h3>Leave Meeting?</h3>
              <p className="recording-description">
                Choose how you want to leave the meeting.
              </p>
              <div className="leave-modal-notes">
                <p className="leave-modal-note">
                  <strong>Leave Meeting:</strong> You will leave, others will continue.
                </p>
                <p className="leave-modal-note">
                  <strong>End Meeting:</strong> All participants will be disconnected.
                </p>
              </div>
              <div className="recording-actions leave-modal-actions">
                <button ref={cancelLeaveBtnRef} className="recording-cancel leave-btn-cancel" onClick={cancelHostLeave}>
                  <span aria-hidden="true">↩️</span> Cancel
                </button>
                <button className="recording-start leave-btn-primary" onClick={confirmHostLeaveOnly}>
                  <span aria-hidden="true">🚪</span> Leave Meeting (Host Only)
                </button>
                <button className="leave-confirm-btn leave-btn-danger" onClick={confirmHostLeaveForAll}>
                  <span aria-hidden="true">❌</span> End Meeting for All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

