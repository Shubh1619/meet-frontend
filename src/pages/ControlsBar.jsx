import React from "react";

const ControlsBar = ({
  onToggleMic,
  onToggleCamera,
  onShareScreen,
  onRecord,
  onCaptions,
  onChat,
  onLeave
}) => {
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#333", padding: "10px", display: "flex", justifyContent: "center", gap: "10px" }}>
      <button onClick={onToggleMic}>Mic</button>
      <button onClick={onToggleCamera}>Camera</button>
      <button onClick={onShareScreen}>Share Screen</button>
      <button onClick={onRecord}>Record</button>
      <button onClick={onCaptions}>Captions</button>
      <button onClick={onChat}>Chat</button>
      <button onClick={onLeave}>Leave</button>
    </div>
  );
};

export default ControlsBar;