import React, { useEffect, useRef, useState } from 'react';
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
  isMirrored = false
}) => {
  const videoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const timeoutRef = useRef(null);
  
  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.log('Video play error:', e));
    }
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
  
  // Auto-hide controls
  const handleMouseEnter = () => {
    setShowControls(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
  
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setShowControls(false), 2000);
  };
  
  // Connection state indicator
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
      className={`video-tile ${isPinned ? 'pinned' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
            zIndex: 2
          }}
        />
      )}
      
      {/* Pin button */}
      <button
        className="video-tile-pin"
        onClick={onTogglePin}
        style={{ opacity: showControls ? 1 : 0.6 }}
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
          className={`video-tile-video ${isMirrored ? 'mirrored' : ''}`}
          onDoubleClick={toggleFullscreen}
        />
        
        {!videoEnabled && (
          <div className="video-off-overlay">
            <FaVideoSlash size={32} />
            <span>Camera off</span>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="video-tile-footer">
        <div className="video-tile-name">
          {name} {isLocal && '(You)'}
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