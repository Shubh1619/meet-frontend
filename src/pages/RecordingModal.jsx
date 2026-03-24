import React, { useState } from "react";

const RecordingModal = ({ isOpen, onClose, onSelectOption, onStartRecording }) => {
  const [selectedOption, setSelectedOption] = useState("screen");

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", width: "400px" }}>
        <h3>Start Recording</h3>
        <div>
          <label>
            <input
              type="radio"
              value="screen"
              checked={selectedOption === "screen"}
              onChange={(e) => setSelectedOption(e.target.value)}
            />
            Record Screen
          </label>
          <label>
            <input
              type="radio"
              value="camera"
              checked={selectedOption === "camera"}
              onChange={(e) => setSelectedOption(e.target.value)}
            />
            Record Camera
          </label>
        </div>
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => { onSelectOption(selectedOption); onStartRecording(); onClose(); }}>Start</button>
        </div>
      </div>
    </div>
  );
};

export default RecordingModal;