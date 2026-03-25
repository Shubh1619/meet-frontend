import React, { useRef, useEffect } from "react";
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

const VideoTile = ({ id, name, isLocal, isPinned, captions, stream, audioEnabled, videoEnabled, onTogglePin }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", margin: "5px", position: "relative" }}>
      <video ref={videoRef} autoPlay playsInline muted={isLocal} style={{ width: "100%", height: "200px", background: "#000" }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        <span>{name} {isLocal ? "(You)" : ""}</span>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
          {videoEnabled ? <FaVideo /> : <FaVideoSlash />}
        </span>
      </div>
      {captions && <div style={{ marginTop: "4px", fontStyle: "italic" }}>{captions}</div>}
      <button onClick={() => onTogglePin(id)} style={{ position: "absolute", top: "5px", right: "5px" }}>
        {isPinned ? "Unpin" : "Pin"}
      </button>
    </div>
  );
};

export default VideoTile;   