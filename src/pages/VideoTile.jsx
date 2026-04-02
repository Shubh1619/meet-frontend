import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaThumbtack } from 'react-icons/fa';

const VideoTile = ({
  id,
  name,
  isLocal,
  stream,
  audioEnabled,
  videoEnabled,
  isPinned,
  connectionState,
  onTogglePin,
  isMirrored = false,
  captions,
  avatarUrl
}) => {
  const videoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const timeoutRef = useRef(null);
  const displayName = (name || "").trim() || "Guest";
  const initials = useMemo(() => {
    const words = displayName.split(/\s+/).filter(Boolean);
    if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  const avatarGradient = useMemo(() => {
    const palette = [
      ["#2563eb", "#60a5fa"],
      ["#7c3aed", "#a78bfa"],
      ["#0ea5e9", "#22d3ee"],
      ["#16a34a", "#4ade80"],
      ["#ea580c", "#fb923c"],
      ["#db2777", "#f472b6"],
    ];
    const seed = displayName.charCodeAt(0) || 0;
    const [from, to] = palette[seed % palette.length];
    return `linear-gradient(135deg, ${from}, ${to})`;
  }, [displayName]);

  const hasLiveVideoTrack = useMemo(() => {
    const tracks = stream?.getVideoTracks?.() || [];
    return tracks.some((track) => track.readyState === "live");
  }, [stream]);

  const shouldShowCameraOff = !hasLiveVideoTrack;
  
  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      const playVideo = () => {
        videoRef.current?.play?.().catch((e) => console.log('Video play error:', e));
      };
      videoRef.current.onloadedmetadata = playVideo;
      playVideo();

      const tracks = [
        ...(stream.getVideoTracks?.() || []),
        ...(stream.getAudioTracks?.() || []),
      ];
      tracks.forEach((track) => {
        track.onunmute = playVideo;
      });
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = null;
      }
      const tracks = [
        ...(stream?.getVideoTracks?.() || []),
        ...(stream?.getAudioTracks?.() || []),
      ];
      tracks.forEach((track) => {
        track.onunmute = null;
      });
    };
  }, [stream]);
  
  // Handle fullscreen
  const toggleFullscreen = async () => {
    if (!videoRef.current) return;
    
    try {
      if (!isFullscreen) {
        await videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Auto-hide controls on desktop only
  const handleMouseEnter = () => {
    if (isMobile) return;
    setShowControls(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
  
  const handleMouseLeave = () => {
    if (isMobile) return;
    timeoutRef.current = setTimeout(() => setShowControls(false), 2000);
  };
  
  // Connection state indicator color
  const getConnectionStateColor = () => {
    switch (connectionState) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  return (
    <div
      className={`video-tile ${isPinned ? 'is-pinned' : ''} ${isFullscreen ? 'fullscreen' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={() => isMobile && setShowControls(true)}
      onTouchEnd={() => isMobile && setTimeout(() => setShowControls(false), 3000)}
    >
      {/* Connection indicator */}
      {connectionState && !isLocal && (
        <div
          className="connection-indicator"
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getConnectionStateColor(),
            zIndex: 2,
            boxShadow: '0 0 0 2px rgba(0,0,0,0.3)'
          }}
        />
      )}
      
      {/* Pin button */}
      <button
        className="video-tile-pin"
        onClick={onTogglePin}
        style={{ 
          opacity: (showControls || isMobile) ? 1 : 0.6,
          transform: isPinned ? 'rotate(45deg)' : 'none'
        }}
        aria-label={isPinned ? "Unpin video" : "Pin video"}
      >
        <FaThumbtack />
      </button>
      
      {/* Video element */}
      <div className="video-tile-media">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`video-tile-video ${(isLocal || isMirrored) ? 'video-tile-video-mirrored' : ''}`}
          onDoubleClick={toggleFullscreen}
        />
        
        {shouldShowCameraOff && (
          <div className="video-off-overlay">
            <div className="video-off-avatar" style={{ background: avatarGradient }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="video-off-avatar-image" />
              ) : (
                <span className="video-off-avatar-initials">{initials || "G"}</span>
              )}
            </div>
            <div className="video-off-status">
              <span className="video-off-icon" aria-hidden="true">{"\u{1F4F7}\u274C"}</span>
              <span>Camera Off</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Captions */}
      {captions && (
        <div className="video-tile-captions">
          {captions}
        </div>
      )}
      
      {/* Footer */}
      <div className="video-tile-footer">
        <div className="video-tile-name" title={displayName}>
          {displayName} {isLocal && '(You)'}
        </div>
        <div className="video-tile-status">
          {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
          {videoEnabled ? <FaVideo /> : <FaVideoSlash />}
        </div>
      </div>
    </div>
  );
};

export default React.memo(VideoTile);

