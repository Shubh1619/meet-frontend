import React from "react";
import {
  FaClosedCaptioning,
  FaCommentDots,
  FaDesktop,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneSlash,
  FaVideo,
  FaVideoSlash,
  FaCircle,
} from "react-icons/fa";

const ControlsBar = ({
  isMicOn,
  isCameraOn,
  isSharingScreen,
  isRecording,
  captionsEnabled,
  chatOpen,
  unreadChatCount = 0,
  onToggleMic,
  onToggleCamera,
  onShareScreen,
  onRecord,
  onCaptions,
  onChat,
  onLeave
}) => {
  const controls = [
    {
      key: "mic",
      label: isMicOn ? "Mic On" : "Mic Off",
      icon: isMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />,
      onClick: onToggleMic,
      active: isMicOn,
    },
    {
      key: "camera",
      label: isCameraOn ? "Camera On" : "Camera Off",
      icon: isCameraOn ? <FaVideo /> : <FaVideoSlash />,
      onClick: onToggleCamera,
      active: isCameraOn,
    },
    {
      key: "screen",
      label: isSharingScreen ? "Stop Share" : "Share Screen",
      icon: <FaDesktop />,
      onClick: onShareScreen,
      active: isSharingScreen,
    },
    {
      key: "record",
      label: isRecording ? "Stop Recording" : "Record",
      icon: isRecording ? <FaCircle /> : <FaCircle />,
      onClick: onRecord,
      active: isRecording,
      accent: "record",
    },
    // {
    //   key: "captions",
    //   label: captionsEnabled ? "Captions On" : "Captions",
    //   icon: <FaClosedCaptioning />,
    //   onClick: onCaptions,
    //   active: captionsEnabled,
    // },
    {
      key: "chat",
      label: chatOpen ? "Close Chat" : "Chat",
      icon: <FaCommentDots />,
      onClick: onChat,
      active: chatOpen,
    },
  ];

  return (
    <div className="controls-dock">
      <div className="controls-bar">
        {controls.map((control) => (
          <button
            key={control.key}
            type="button"
            className={`control-button${control.active ? " is-active" : ""}${control.accent ? ` control-${control.accent}` : ""}`}
            onClick={control.onClick}
          >
            <span className="control-icon">{control.icon}</span>
            <span className="control-label">{control.label}</span>
            {control.key === "chat" && unreadChatCount > 0 && (
              <span className="control-badge">{unreadChatCount > 99 ? "99+" : unreadChatCount}</span>
            )}
          </button>
        ))}
        <button type="button" className="control-button control-leave" onClick={onLeave}>
          <span className="control-icon">
            <FaPhoneSlash />
          </span>
          <span className="control-label">Leave</span>
        </button>
      </div>
    </div>
  );
};

export default ControlsBar;
