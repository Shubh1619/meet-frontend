import React, { useRef, useEffect } from "react";
import {
  FaVideo,
  FaVideoSlash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaThumbtack,
} from "react-icons/fa";

const VideoTile = ({
  id,
  name,
  isLocal,
  isPinned,
  captions,
  stream,
  audioEnabled,
  videoEnabled,
  onTogglePin,
  isFeatured = false,
  isMirrored = false,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <article className={`video-tile${isFeatured ? " video-tile-featured" : ""}${isPinned ? " is-pinned" : ""}`}>
      <button
        type="button"
        className="video-tile-pin"
        onClick={() => onTogglePin(id)}
        aria-label={isPinned ? `Unpin ${name}` : `Pin ${name}`}
      >
        <FaThumbtack />
      </button>
      <div className="video-tile-media">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`video-tile-video${isLocal && isMirrored ? " video-tile-video-mirrored" : ""}`}
        />
        {!videoEnabled && <div className="video-tile-video-off">Camera off</div>}
      </div>
      <div className="video-tile-footer">
        <span className="video-tile-name">
          {name} {isLocal ? "(You)" : ""}
        </span>
        <span className="video-tile-status">
          {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
          {videoEnabled ? <FaVideo /> : <FaVideoSlash />}
        </span>
      </div>
      {captions && <div className="video-tile-captions">{captions}</div>}
    </article>
  );
};

export default VideoTile;
