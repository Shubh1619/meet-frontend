import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// -----------------------------------------------------------
//  FINAL MEETING ROOM WITH:
//  - Mirrored camera pipeline
//  - Real-time chat sidebar
//  - Notes sidebar + download as TXT
//  - Pure screen recording (screen + system audio + mic)
//  - Screen share
//  - Leave meeting redirects without closing camera
// -----------------------------------------------------------

export default function MeetingRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams();

  // CAMERA PIPELINE REFS
  const localVideoRef = useRef(null); // mirrored preview
  const rawVideoRef = useRef(null);   // unmirrored hidden video
  const canvasRef = useRef(null);
  const screenVideoRef = useRef(null);

  // STREAM STATES
  const [cameraStream, setCameraStream] = useState(null);
  const [canvasStream, setCanvasStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // TOGGLE STATES
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // RECORDING HANDLERS
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // UI — participants example
  const [participants] = useState([{ id: "you", name: "You" }]);

  // CHAT & NOTES SIDEBARS
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [notes, setNotes] = useState("");

  // RAF ID
  const rafRef = useRef(null);

  // -----------------------------------------------------------
  // CAMERA INIT
  // -----------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setCameraStream(stream);

        // raw (unmirrored)
        if (rawVideoRef.current) {
          rawVideoRef.current.srcObject = stream;
          rawVideoRef.current.play().catch(() => {});
        }

        // mirrored preview
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        startCanvasMirror();
      } catch (err) {
        console.error(err);
        alert("Please allow camera & microphone.");
      }
    }

    initCamera();

    return () => {
      stopCanvasMirror();
    };
  }, []);

  // -----------------------------------------------------------
  // MIRROR PIPELINE USING CANVAS
  // -----------------------------------------------------------
  function startCanvasMirror() {
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
      canvas.style.display = "none";
      document.body.appendChild(canvas);
    }

    const rawVideo = rawVideoRef.current;
    const ctx = canvas.getContext("2d");

    function draw() {
      if (!rawVideo || rawVideo.readyState < 2) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const w = rawVideo.videoWidth;
      const h = rawVideo.videoHeight;

      canvas.width = w;
      canvas.height = h;

      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(rawVideo, -w, 0, w, h);
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    const mirrored = canvas.captureStream(30);
    setCanvasStream(mirrored);
  }

  function stopCanvasMirror() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (canvasStream) {
      try {
        canvasStream.getTracks().forEach((t) => t.stop());
      } catch {}
    }
  }

  // -----------------------------------------------------------
  // CAMERA + MIC TOGGLES
  // -----------------------------------------------------------
  function toggleMic() {
    if (!cameraStream) return;
    const track = cameraStream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setIsMicOn(track.enabled);
  }

  function toggleCamera() {
    if (!cameraStream) return;
    const track = cameraStream.getVideoTracks()[0];
    track.enabled = !track.enabled;
    setIsCameraOn(track.enabled);
  }

  // -----------------------------------------------------------
  // SCREEN SHARE
  // -----------------------------------------------------------
  async function startScreenShare() {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      setScreenStream(screen);
      setIsScreenSharing(true);

      screenVideoRef.current.srcObject = screen;

      screen.getTracks()[0].onended = () => stopScreenShare();
    } catch {}
  }

  function stopScreenShare() {
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    setIsScreenSharing(false);
    screenVideoRef.current.srcObject = null;
  }

  // -----------------------------------------------------------
  // SCREEN RECORDING (screen + system audio + mic)
  // -----------------------------------------------------------
  async function startRecording() {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true, // system audio
      });

      const micTracks = cameraStream
        ? cameraStream.getAudioTracks()
        : [];

      const finalStream = new MediaStream();

      // video
      screen.getVideoTracks().forEach((t) => finalStream.addTrack(t));

      // system audio
      screen.getAudioTracks().forEach((t) => finalStream.addTrack(t));

      // mic
      micTracks.forEach((t) => finalStream.addTrack(t));

      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(finalStream, {
        mimeType: "video/webm; codecs=vp9",
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
        a.download = `meetifyScreen-${Date.now()}.webm`;
        a.click();
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);

      screen.getTracks()[0].onended = () => stopRecording();
    } catch (err) {
      console.error(err);
      alert("Recording failed.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  // -----------------------------------------------------------
  // LEAVE (camera stays ON)
  // -----------------------------------------------------------
  function leaveMeeting() {
    if (isRecording) stopRecording();
    if (isScreenSharing) stopScreenShare();

    // camera is intentionally NOT stopped
    navigate("/dashboard");
  }

  // -----------------------------------------------------------
  // CHAT
  // -----------------------------------------------------------
  function sendMessage() {
    if (!msgInput.trim()) return;

    setChatMessages((prev) => [...prev, { from: "You", text: msgInput }]);
    setMsgInput("");
  }

  // -----------------------------------------------------------
  // NOTES DOWNLOAD
  // -----------------------------------------------------------
  function downloadNotes() {
    const blob = new Blob([notes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `meetify-notes-${Date.now()}.txt`;
    a.click();
  }

  // -----------------------------------------------------------
  // GRID LAYOUT
  // -----------------------------------------------------------
  const getGridCols = (count) => {
    if (count === 1) return "1fr";
    if (count <= 4) return "1fr 1fr";
    if (count <= 6) return "1fr 1fr 1fr";
    if (count <= 9) return "1fr 1fr 1fr";
    return "1fr 1fr 1fr 1fr";
  };

  // -----------------------------------------------------------
  // UI RENDER
  // -----------------------------------------------------------
  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FF", paddingTop: 70 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 20 }}>
        
        {/* ---------------- HEADER ---------------- */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
          fontWeight: 700,
          fontSize: 18,
        }}>
          <div>Meetify Conference</div>
          <div style={{
            padding: "6px 14px",
            background: "linear-gradient(135deg,#6759FF,#A79BFF)",
            color: "#fff",
            borderRadius: 20,
          }}>
            {participants.length} Participants
          </div>
        </div>

        {/* ---------------- VIDEO GRID ---------------- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: getGridCols(participants.length),
            gap: 12,
          }}
        >
          {/* SELF VIDEO */}
          <div
            style={{
              background: "#000",
              borderRadius: 12,
              overflow: "hidden",
              aspectRatio: "16/9",
              position: "relative",
            }}
          >
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
            <div
              style={{
                position: "absolute",
                left: 10,
                bottom: 10,
                padding: "6px 12px",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                borderRadius: 12,
              }}
            >
              You
            </div>
          </div>
        </div>

        {/* SCREEN SHARE VIEW */}
        {isScreenSharing && (
          <div style={{
            marginTop: 16,
            background: "#000",
            borderRadius: 12,
            overflow: "hidden",
            height: 260,
            position: "relative",
          }}>
            <video ref={screenVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%" }} />
            <div style={{
              position: "absolute",
              top: 10,
              left: 10,
              padding: "6px 10px",
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              borderRadius: 10,
              fontWeight: 600,
            }}>Screen Share</div>
          </div>
        )}

        {/* ---------------- CONTROL BAR ---------------- */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "center",
            gap: 12,
            background: "#fff",
            padding: 16,
            borderRadius: 40,
            boxShadow: "0 -3px 12px rgba(0,0,0,0.08)",
          }}
        >
          <button style={btn(isMicOn)} onClick={toggleMic}>
            {isMicOn ? "Mute" : "Unmute"}
          </button>

          <button style={btn(isCameraOn)} onClick={toggleCamera}>
             {isCameraOn ? "Camera Off" : "Camera On"}
          </button>

          <button style={btn(isScreenSharing)} onClick={isScreenSharing ? stopScreenShare : startScreenShare}>
            {isScreenSharing ? "Stop share" : "Share Screen"}
          </button>

          <button style={recordBtn(isRecording)} onClick={isRecording ? stopRecording : startRecording}>
            {isRecording ? "Stop Recording" : "Record Screen"}
          </button>

          <button style={leaveBtn} onClick={leaveMeeting}>
            Leave
          </button>

          {/* Chat & Notes Buttons */}
          <button style={sideBtn} onClick={() => setIsChatOpen(true)}>Chat</button>
          <button style={sideBtn} onClick={() => setIsNotesOpen(true)}>Notes</button>
        </div>
      </div>

      {/* ---------------- CHAT SIDEBAR ---------------- */}
      <div style={sidebar(isChatOpen)}>
        <div style={sideHeader}>
          <span>Chat</span>
          <button onClick={() => setIsChatOpen(false)} style={closeBtn}>✖</button>
        </div>

        <div style={chatBox}>
          {chatMessages.map((m, i) => (
            <div key={i} style={chatMsg}>{m.from}: {m.text}</div>
          ))}
        </div>

        <div style={chatInputBox}>
          <input
            style={chatInput}
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            placeholder="Type message..."
          />
          <button style={sendBtn} onClick={sendMessage}>➤</button>
        </div>
      </div>

      {/* ---------------- NOTES SIDEBAR ---------------- */}
      <div style={sidebar(isNotesOpen)}>
        <div style={sideHeader}>
          <span>Notes</span>
          <button onClick={() => setIsNotesOpen(false)} style={closeBtn}>✖</button>
        </div>

        <textarea
          style={notesArea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write notes here..."
        />

        <button style={downloadBtn} onClick={downloadNotes}>
          ⬇ Download Notes
        </button>
      </div>

      {/* Hidden raw video */}
      <video ref={rawVideoRef} playsInline muted style={{ display: "none" }} />
    </div>
  );
}

/* -------------------------- STYLES -------------------------- */

const btn = (active) => ({
  padding: "10px 16px",
  borderRadius: 28,
  border: "1px solid #6759FF",
  background: active ? "#6759FF" : "transparent",
  color: active ? "#fff" : "#6759FF",
  fontWeight: 600,
  cursor: "pointer",
});

const recordBtn = (active) => ({
  padding: "10px 16px",
  borderRadius: 28,
  border: "1px solid #FF4757",
  background: active ? "#FF4757" : "transparent",
  color: active ? "#fff" : "#FF4757",
  fontWeight: 600,
  cursor: "pointer",
});

const leaveBtn = {
  padding: "10px 16px",
  borderRadius: 28,
  background: "linear-gradient(135deg,#FF4757,#FF6B7A)",
  border: "none",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const sideBtn = {
  padding: "10px 16px",
  borderRadius: 28,
  background: "#F2F1FF",
  border: "1px solid #6759FF",
  color: "#6759FF",
  fontWeight: 600,
  cursor: "pointer",
};

/* SIDEBAR */
const sidebar = (open) => ({
  width: 320,
  position: "fixed",
  top: 0,
  right: open ? 0 : -340,
  height: "100%",
  background: "#fff",
  boxShadow: "-4px 0 16px rgba(0,0,0,0.12)",
  padding: 16,
  transition: "right .3s ease",
  zIndex: 999,
});

const sideHeader = {
  display: "flex",
  justifyContent: "space-between",
  fontWeight: 700,
  marginBottom: 12,
  fontSize: 18,
};

const closeBtn = {
  border: "none",
  background: "transparent",
  fontSize: 20,
  cursor: "pointer",
};

const chatBox = {
  flex: 1,
  overflowY: "auto",
  height: "70vh",
  paddingRight: 5,
};

const chatMsg = {
  padding: "6px 8px",
  background: "#F2F1FF",
  marginBottom: 6,
  borderRadius: 6,
};

const chatInputBox = {
  display: "flex",
  marginTop: 10,
};

const chatInput = {
  flex: 1,
  padding: 8,
  borderRadius: 8,
  border: "1px solid #ccc",
};

const sendBtn = {
  padding: "8px 14px",
  borderRadius: 8,
  background: "#6759FF",
  color: "#fff",
  border: "none",
};

const notesArea = {
  width: "100%",
  height: "70vh",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  resize: "none",
  marginBottom: 10,
};

const downloadBtn = {
  width: "100%",
  padding: "10px 14px",
  background: "#6759FF",
  color: "#fff",
  borderRadius: 10,
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
};

