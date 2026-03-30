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
  onGenerateAI,
  onChat,
  onLeave,
  canShareScreen = true,
  canCaptions = true,
  canRecord = true,
  canGenerateAI = false,
  canAdminControl = false,
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
      hidden: !canShareScreen,
      disabled: !canShareScreen,
    },
    {
      key: "record",
      label: isRecording ? "Stop Recording" : "Record",
      icon: isRecording ? <FaCircle /> : <FaCircle />,
      onClick: onRecord,
      active: isRecording,
      accent: "record",
      hidden: !canRecord,
      disabled: !canRecord,
    },
    {
      key: "captions",
      label: captionsEnabled ? "Captions On" : "Captions",
      icon: <FaClosedCaptioning />,
      onClick: onCaptions,
      active: captionsEnabled,
      hidden: !canCaptions,
      disabled: !canCaptions,
    },
    {
      key: "ai-summary",
      label: "AI Summary",
      icon: <FaCircle />,
      onClick: onGenerateAI,
      active: false,
      hidden: !canGenerateAI,
      disabled: !canGenerateAI,
    },
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
        {controls.filter((control) => !control.hidden).map((control) => (
          <button
            key={control.key}
            type="button"
            className={`control-button${control.active ? " is-active" : ""}${control.accent ? ` control-${control.accent}` : ""}`}
            onClick={control.onClick}
            disabled={control.disabled}
            title={control.disabled ? "Disabled by host" : control.label}
          >
            <span className="control-icon">{control.icon}</span>
            <span className="control-label">{control.label}</span>
            {control.key === "chat" && unreadChatCount > 0 && (
              <span className="control-badge">{unreadChatCount > 99 ? "99+" : unreadChatCount}</span>
            )}
          </button>
        ))}
        {canAdminControl && (
          <span className="control-badge" style={{ marginLeft: 8 }}>
            Host Controls Enabled
          </span>
        )}
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
